// services/user-service/index.js
require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('./src/generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const app = express();
const PORT = 8001;

// 인증을 제거했으므로 프로필 조회는 이 고정 사용자 ID를 사용 (DEFAULT_USER_ID 로 변경 가능)
const DEFAULT_USER_ID = Number(process.env.DEFAULT_USER_ID) || 1;

// Fail fast on missing required env
if (!process.env.DATABASE_URL) {
  console.error('[User Service] FATAL: DATABASE_URL is not set.');
  process.exit(1);
}

const cors = require('cors');
app.use(express.json());
const allowedOrigins = [
  'https://personal-expense-tracker-front-end.vercel.app', // Production
  'http://localhost:5173', // Local Vite Dev Server
  'http://localhost:3000', // Alternative Local Port
];

app.use(
  cors({
    origin: function (origin, callback) {
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

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// [GET] base route
app.get('/', (req, res) => {
  res.json({ message: 'Personal Financial Dashboard - User Service 작동 중' });
});

// [GET] get user name
app.get('/username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: DEFAULT_USER_ID },
      select: { name: true },
    });

    // 인증이 없으므로 사용자가 없어도 기본 이름으로 응답
    res.json({ name: user?.name || 'Guest' });
  } catch (error) {
    console.error('Error fetching username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`[User Service] running on http://localhost:${PORT}`);
});
