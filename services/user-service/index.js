// services/user-service/index.js
require('dotenv').config();

const express = require('express');
const { PrismaClient } = require('./src/generated/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const app = express();
const PORT = 8001;

const cors = require('cors');
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: 'https://personal-expense-tracker-front-end.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}); */

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

// [POST] 회원가입: 실제 DB에 사용자 저장
app.post('/signup', async (req, res) => {
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
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. 유저 존재 여부 확인
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'Does not exist.' });
    }

    // 2. 비밀번호 비교 (회원가입 시 bcrypt를 썼다고 가정)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Wrong password.' });
    }

    // 3. JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' } // 1시간 동안 유효로 바꿀것
    );

    res.json({ message: 'Login Successful', token });
  } catch (error) {
    res.status(500).json({ error: 'Server Error', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[User Service] running on http://localhost:${PORT}`);
});
