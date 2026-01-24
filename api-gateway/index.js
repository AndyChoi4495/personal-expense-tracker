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
    proxyReqPathResolver: (req) => {
      return req.url; // /users/signup -> /signup
    },
    // 아래 설정을 추가하여 프록시 과정에서 주소가 바뀌는 것을 방지합니다.
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },
    userResHeaderDecorator(headers, userReq, userRes, proxyReq, proxyRes) {
      headers['access-control-allow-origin'] =
        'https://personal-expense-tracker-front-end.vercel.app';
      headers['access-control-allow-methods'] = 'GET,POST,PUT,DELETE,OPTIONS';
      headers['access-control-allow-headers'] = 'Content-Type,Authorization';
      return headers;
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
