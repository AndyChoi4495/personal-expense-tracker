import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      // API Gateway를 통해 User Service로 요청을 보냅니다.
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/users/register`, {
        email,
        password,
      });
      alert('회원가입 성공! 로그인해주세요.');
      navigate('/login');
    } catch (error) {
      alert('회원가입 실패: ' + error.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <h2>회원가입</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">가입하기</button>
    </form>
  );
};

export default SignUp;
