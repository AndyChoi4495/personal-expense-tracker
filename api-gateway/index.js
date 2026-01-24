const express = require('express');
const proxy = require('express-http-proxy');
const app = express();
const PORT = process.env.PORT || 8000; // Vercel 환경 포트 대응

const cors = require('cors');
app.use(cors());

// 환경 변수에서 서비스 URL을 읽어옵니다. (없을 경우 로컬 주소 사용)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const TRANS_SERVICE_URL = process.env.TRANS_SERVICE_URL || 'http://localhost:8002';

app.use(
  cors({
    origin: 'https://personal-expense-tracker-front-end.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);
// 유저 관련 요청 프록시
app.use(
  '/users',
  proxy(USER_SERVICE_URL, {
    // 1. 경로 재작성: /users/signup -> /signup
    proxyReqPathResolver: (req) => {
      const parts = req.url.split('?');
      const path = parts[0];
      const query = parts[1] ? `?${parts[1]}` : '';
      return path + query;
    },
    // 2. 리다이렉트 방지: 프록시가 내부적으로 처리하도록 강제
    parseReqBody: true,
    preserveHostHdr: false, // Vercel 환경에서는 false가 안정적입니다.
    proxyReqOptDecorator: (proxyReqOpts) => {
      // Vercel이 리다이렉트를 시키지 않도록 헤더를 고정합니다.
      proxyReqOpts.headers['Connection'] = 'keep-alive';
      return proxyReqOpts;
    },
  })
);

// 지출 관련 요청 프록시
app.use(
  '/transactions',
  proxy(TRANS_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return req.url;
    },
  })
);

app.get('/', (req, res) => {
  res.send('API Gateway가 작동 중입니다.');
});

app.listen(PORT, () => {
  console.log(`[Gateway] running on port ${PORT}`);
});
