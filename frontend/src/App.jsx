import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';

function App() {
  return (
    <Router>
      <Routes>
        {/* 브라우저에서 /login을 입력하면 Login 컴포넌트가 뜹니다 */}
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/signUp" element={<SignUp />} />

        {/* 기본 경로(/)로 접속했을 때 자동으로 /login으로 보내줍니다 */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
