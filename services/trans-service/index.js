// services/trans-service/index.js

require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8002;

const cors = require('cors');
app.options('*', cors());
app.use(
  cors({
    origin: '*', // gateway , front -end 만 허용으로 바꿔야됨
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const JWT_SECRET = process.env.JWT_SECRET;

const { PrismaClient } = require('./src/generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { Decimal } = require('decimal.js');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

app.use(express.json());

// [미들웨어] 토큰 확인 함수
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" 형식

  if (!token) return res.status(401).json({ error: '로그인이 필요합니다.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
    req.user = user; // 토큰에 담긴 userId를 추출해서 저장
    next();
  });
};

// [GET] 로그인한 사용자의 모든 거래 내역 조회
app.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId; // 토큰에서 추출한 안전한 사용자 ID

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { date: 'desc' }, // Recent transaction on top
    });

    res.json({
      status: 'success',
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Fail to Load.' });
  }
});

// [GET] 이번 달 소비 통계 조회
app.get('/stats/summary', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  const now = new Date();
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  try {
    // Fetch ALL transactions for the month to calculate both types
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    let totalExpense = 0;
    let totalIncome = 0;
    const categoryMap = {};

    transactions.forEach((item) => {
      const amount = parseFloat(item.amount);
      if (item.type === 'EXPENSE') {
        totalExpense += amount;
        categoryMap[item.category] = (categoryMap[item.category] || 0) + amount;
      } else if (item.type === 'INCOME') {
        totalIncome += amount;
      }
    });

    const categoryStats = Object.keys(categoryMap).map((cat) => ({
      category: cat,
      amount: categoryMap[cat],
      percentage:
        totalExpense > 0 ? ((categoryMap[cat] / totalExpense) * 100).toFixed(1) : 0,
    }));

    res.json({
      month: targetMonth + 1,
      totalExpense,
      totalIncome, // Added totalIncome to the response
      currency: 'CAD',
      breakdown: categoryStats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Calculation error' });
  }
});

// [GET] 지난달 vs 이번 달 소비 비교
app.get('/stats/comparison', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const now = new Date();

  // 1. 날짜 범위 설정
  // 이번 달: 1일 ~ 현재
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 지난달: 지난달 1일 ~ 지난달 말일
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  try {
    // 2. 이번 달과 지난달의 지출 합계 각각 구하기 (Prisma의 _sum 기능 활용)
    const thisMonthSum = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfThisMonth, lte: now },
      },
    });

    const lastMonthSum = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    const thisTotal = parseFloat(thisMonthSum._sum.amount || 0);
    const lastTotal = parseFloat(lastMonthSum._sum.amount || 0);

    // 3. 차액 및 증감률 계산
    const difference = thisTotal - lastTotal;
    let percentageDiff = 0;
    if (lastTotal > 0) {
      percentageDiff = ((difference / lastTotal) * 100).toFixed(1);
    }

    res.json({
      thisMonthTotal: thisTotal,
      lastMonthTotal: lastTotal,
      difference: difference,
      percentageChange: percentageDiff,
      currency: 'CAD',
      message:
        difference > 0
          ? `Spend $${difference.toFixed(2)} more than last month .`
          : `Spend $${Math.abs(difference).toFixed(2)} less than last month.`,
    });
  } catch (error) {
    console.error('비교 통계 에러:', error);
    res.status(500).json({ error: '데이터 비교 중 오류가 발생했습니다.' });
  }
});

// [POST] add transactions
app.post('/', authenticateToken, async (req, res) => {
  const { amount, category, type, note, currency, date } = req.body;
  const userId = req.user.userId;

  try {
    const newTransaction = await prisma.transaction.create({
      data: {
        userId,
        amount: new Decimal(amount),
        // 요청에 currency가 없으면 DB 기본값(CAD)이 들어감
        currency: currency || 'CAD',
        category,
        type,
        note,
        date: date ? new Date(date) : undefined,
      },
    });
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(500).json({ error: 'Failture', detail: error.message });
  }
});
app.listen(PORT, () => console.log(`[Transaction Service] running on 8002`));
