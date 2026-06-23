require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8003;

// Fail fast on missing required env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[AI Service] FATAL: JWT_SECRET is not set.');
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error('[AI Service] FATAL: GEMINI_API_KEY is not set.');
  process.exit(1);
}

// Gemini SDK 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.use(cors());
app.use(express.json());

// [미들웨어] 토큰 확인 함수 — protects Gemini calls from anonymous abuse
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
};

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Personal Financial Dashboard - AI Service running' });
});

app.post('/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  const authHeader = req.headers.authorization;

  console.log(`[AI-Service] New Request: ${message}`);

  try {
    const transUrl = process.env.TRANS_SERVICE_URL || 'http://localhost:8002';

    // 1. 가계부 데이터 가져오기
    // trans-service mounts stats at /stats/summary (no /transactions prefix)
    const statsRes = await axios
      .get(`${transUrl}/stats/summary`, {
        headers: { Authorization: authHeader },
      })
      .catch((err) => {
        console.log(
          '[AI-Service] Warning: Could not fetch stats, using empty context.'
        );
        return { data: { totalIncome: 0, totalExpense: 0, breakdown: [] } };
      });

    const data = statsRes.data;

    // 2. AI 프롬프트 구성
    const prompt = `
      You are a professional financial advisor. 
      Context: Income ${data.totalIncome} CAD, Expense ${data.totalExpense} CAD.
      Breakdown: ${JSON.stringify(data.breakdown)}

      User Question: "${message}"

      Instructions:
      1. If there is no data, briefly explain why and give tips.
      2. Use clearly separated bullet points (e.g., 1., 2., 3.).
      3. Use double line breaks between points for readability.
      4. Keep it concise and professional.
    `;

    // 3. Gemini API 호출
    console.log('[AI-Service] Contacting Gemini API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[AI-Service] Response generated successfully.');
    res.json({ answer: text });
  } catch (error) {
    console.error('[AI-Service] Error details:', error.message);

    res.status(500).json({
      error: 'AI Error',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`[AI Service] Started on port ${PORT}`);
});
