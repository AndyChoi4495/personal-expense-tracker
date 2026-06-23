// services/trans-service/index.js

require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8002;

// Fail fast on missing required env
if (!process.env.JWT_SECRET) {
  console.error('[Transaction Service] FATAL: JWT_SECRET is not set.');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('[Transaction Service] FATAL: DATABASE_URL is not set.');
  process.exit(1);
}

const cors = require('cors');
app.use(express.json());

const allowedOrigins = [
  'https://personal-expense-tracker-front-end.vercel.app', // Production
  'https://personal-expense-tracker-kappa-six.vercel.app',
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
    const dateRange = { gte: startOfMonth, lte: endOfMonth };

    // 수입/지출 합계를 DB에서 Decimal로 집계 (parseFloat 누적 오차 방지)
    const totalsByType = await prisma.transaction.groupBy({
      by: ['type'],
      _sum: { amount: true },
      where: { userId, date: dateRange },
    });

    const sumFor = (t) => {
      const row = totalsByType.find((r) => r.type === t);
      return new Decimal(row?._sum.amount?.toString() ?? '0');
    };
    const totalExpenseDec = sumFor('EXPENSE');
    const totalIncomeDec = sumFor('INCOME');

    // 지출 카테고리별 합계
    const byCategory = await prisma.transaction.groupBy({
      by: ['category'],
      _sum: { amount: true },
      where: { userId, type: 'EXPENSE', date: dateRange },
    });

    const breakdown = byCategory.map((row) => {
      const amountDec = new Decimal(row._sum.amount?.toString() ?? '0');
      return {
        category: row.category,
        amount: amountDec.toNumber(),
        percentage: totalExpenseDec.gt(0)
          ? amountDec.div(totalExpenseDec).mul(100).toFixed(1)
          : 0,
      };
    });

    res.json({
      month: targetMonth + 1,
      totalExpense: totalExpenseDec.toNumber(),
      totalIncome: totalIncomeDec.toNumber(),
      currency: 'CAD',
      breakdown,
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

// [PUT] 거래 수정 (본인 소유 거래만)
app.put('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);
  const { amount, category, type, note, currency, date } = req.body;

  try {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        amount: amount !== undefined ? new Decimal(amount) : undefined,
        currency,
        category,
        type,
        note,
        date: date ? new Date(date) : undefined,
      },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failure', detail: error.message });
  }
});

// [DELETE] 거래 삭제 (본인 소유 거래만)
app.delete('/:id', authenticateToken, async (req, res) => {
  const userId = req.user.userId;
  const id = parseInt(req.params.id);

  try {
    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }
    await prisma.transaction.delete({ where: { id } });
    res.json({ message: 'Transaction deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failure', detail: error.message });
  }
});

app.listen(PORT, () => console.log(`[Transaction Service] running on 8002`));
