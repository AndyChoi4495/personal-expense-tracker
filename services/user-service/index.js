// services/user-service/index.js
require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('./src/generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const app = express();
const PORT = 8001;

// Fail fast on missing required env
if (!process.env.JWT_SECRET) {
  console.error('[User Service] FATAL: JWT_SECRET is not set.');
  process.exit(1);
}
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

// Throttle credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token)
    return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

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

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// [GET] base route
app.get('/', (req, res) => {
  res.json({ message: 'Personal Financial Dashboard - User Service 작동 중' });
});

// [GET] get user name
app.get('/username', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ name: user.name });
  } catch (error) {
    console.error('Error fetching username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// [POST] 회원가입: 실제 DB에 사용자 저장
app.post('/signup', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    // 1. 이미 존재하는 이메일인지 먼저 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 중복된 이메일이 있을 경우 409 (Conflict) 상태 코드를 보냅니다.
      return res.status(409).json({ error: 'This email is already registered.' });
    }

    // 2. 비밀번호 해싱 및 유저 생성
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0],
      },
    });

    res.status(201).json({ message: 'Sign up Successful', userId: newUser.id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
});

// [POST] 로그인 API
app.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use a single generic error for both cases to avoid user enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    const isMatch = user && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' } // 배포후 2시간 동안 유효로 바꿀것
    );

    res.json({ message: 'Login Successful', token });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[User Service] running on http://localhost:${PORT}`);
});
