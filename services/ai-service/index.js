require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 8003;

// Gemini SDK 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  const authHeader = req.headers.authorization;

  console.log(`[AI-Service] New Request: ${message}`);

  try {
    const transUrl = process.env.TRANS_SERVICE_URL || 'http://localhost:8002';

    // 1. 가계부 데이터 가져오기

    const statsRes = await axios
      .get(`${transUrl}/transactions/stats/summary`, {
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
