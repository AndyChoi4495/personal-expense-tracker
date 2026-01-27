// services/trans-service/index.js

require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8002;

const cors = require('cors');
app.use(cors());
app.use(express.json());

const allowedOrigins = [
  'https://personal-expense-tracker-front-end.vercel.app', // Production
  'http://localhost:5173', // Local Vite Dev Server
  'http://localhost:3000', // Alternative Local Port
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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

// [GET] 카테고리별 전월 대비 비교
app.get('/stats/category-comparison', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const { month, year } = req.query;

  const now = new Date();
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
  const targetYear = year ? parseInt(year) : now.getFullYear();

  // 1. 기준 달(Target Month) 범위 계산
  const startOfThisMonth = new Date(targetYear, targetMonth, 1);
  const endOfThisMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

  // 2. 이전 달(Previous Month) 범위 계산
  // (Date 객체가 자동으로 연도 바뀜을 처리해줌: 1월에서 -1하면 전년도 12월이 됨)
  const startOfLastMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfLastMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  try {
    // 이번 달(선택된 달) 카테고리별 합계
    const thisMonthStats = await prisma.transaction.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfThisMonth, lte: endOfThisMonth },
      },
    });

    // 지난달(선택된 달의 이전 달) 카테고리별 합계
    const lastMonthStats = await prisma.transaction.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    const categories = [
      ...new Set([...thisMonthStats, ...lastMonthStats].map((s) => s.category)),
    ];

    const comparisonData = categories.map((cat) => ({
      category: cat,
      thisMonth: parseFloat(
        thisMonthStats.find((s) => s.category === cat)?._sum.amount || 0
      ),
      lastMonth: parseFloat(
        lastMonthStats.find((s) => s.category === cat)?._sum.amount || 0
      ),
    }));

    res.json(comparisonData);
  } catch (error) {
    console.error('Comparison Error:', error);
    res.status(500).json({ error: 'Data analysis error.' });
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
