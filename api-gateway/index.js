const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors'); // 상단으로 이동
const app = express();
const PORT = process.env.PORT || 8000;

// 1. CORS 설정을 하나로 통합하여 최상단에 배치
app.use(
  cors({
    origin: 'https://personal-expense-tracker-front-end.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const TRANS_SERVICE_URL = process.env.TRANS_SERVICE_URL || 'http://localhost:8002';

// 2. 유저 관련 요청 프록시
app.use(
  '/users',
  proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      const resolvedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;

      console.log(
        `[Forwarding] ${req.method} to: ${USER_SERVICE_URL}${resolvedPath}`
      );
      return resolvedPath;
    },
    parseReqBody: true,
    preserveHostHdr: false,
  })
);

app.use(
  '/transactions',
  proxy(TRANS_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
      console.log(`[Proxy] Trans-Service로 전달: ${TRANS_SERVICE_URL}${path}`);
      return path;
    },
  })
);

app.get('/', (req, res) => {
  res.send('API Gateway가 작동 중입니다.');
});

app.listen(PORT, () => {
  console.log(`[Gateway] running on port ${PORT}`);
});
