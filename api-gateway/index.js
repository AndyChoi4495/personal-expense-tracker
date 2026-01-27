const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors'); // 상단으로 이동
const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
  'https://personal-expense-tracker-front-end.vercel.app', // Production
  'http://localhost:5173', // Local Development (Vite)
  'http://localhost:3000', // Local Development (React)
];

// 1. CORS 설정을 하나로 통합하여 최상단에 배치
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

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8001';
const TRANS_SERVICE_URL = process.env.TRANS_SERVICE_URL || 'http://localhost:8002';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8003;';

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
      const resolvedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;

      console.log(`[Gateway] 전달 중: ${TRANS_SERVICE_URL}${resolvedPath}`);
      return resolvedPath;
    },
  })
);

app.use('/ai', proxy(AI_SERVICE_URL));

app.get('/', (req, res) => {
  res.send('API Gateway가 작동 중입니다.');
});

app.listen(PORT, () => {
  console.log(`[Gateway] running on port ${PORT}`);
});
