// 로그인 토큰이 없으면 /login 으로 돌려보내는 라우트 가드 컴포넌트
import { Navigate } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

export default RequireAuth;
