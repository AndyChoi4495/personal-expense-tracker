import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Gateway 포트
});

// 토큰 자동 포함 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;