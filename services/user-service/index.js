// services/user-service/index.js
require('dotenv').config(); 

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const app = express();
const PORT = 8001;

const cors = require('cors');
app.use(cors());

// 1. Prisma 7 전용 PostgreSQL 어댑터 설정
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET

app.use(express.json());

// [GET] 서비스 상태 확인
app.get('/', (req, res) => {
    res.json({ message: "Personal Financial Dashboard - User Service 작동 중" });
});

// [GET] 프로필 조회: DB에서 특정 유저 찾기
app.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) }
        });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: "Cannot find the user" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});



// [POST] 회원가입: 실제 DB에 사용자 저장
app.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        // 비밀번호 해싱 (보안 강화)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: { 
                email, 
                password: hashedPassword, 
                name: email.split('@')[0]
            }
        });
        res.status(201).json({ message: "Sign up Successful", userId: newUser.id });
    } catch (error) {
        console.error("Error message:", error);
        res.status(400).json({ error: "Fail to Sign up",
            detail: error.message
         });
    }
});

// [POST] 로그인 API
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. 유저 존재 여부 확인
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "Does not exist." });
        }

        // 2. 비밀번호 비교 (회원가입 시 bcrypt를 썼다고 가정)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Wrong password." });
        }

        // 3. JWT 토큰 생성
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' } // 1시간 동안 유효로 바꿀것
        );

        res.json({ message: "Login Successful", token });
    } catch (error) {
        res.status(500).json({ error: "Server Error", detail: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`[User Service] running on http://localhost:${PORT}`);
});