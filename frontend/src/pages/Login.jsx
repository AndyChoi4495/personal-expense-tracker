import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api'; 
import loginImage from '../images/login_image.png';
import { ChevronRight } from 'lucide-react'; 

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Sending login request to the API gateway
      const res = await api.post('/users/login', { email, password });
      // Storing the JWT token in local storage for authentication
      localStorage.setItem('token', res.data.token);
      // Redirecting to the dashboard on successful login
      navigate('/dashboard');
    } catch (err) {
      alert("Login Failed: " + (err.response?.data?.error || "Server Error"));
    }
  };

  return (
    // Main container using a 1:1 grid layout for desktop
    <div className="grid min-h-screen w-full lg:grid-cols-2 bg-white overflow-hidden">
      
      {/* 1. Left Section: Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-white w-full">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-xl font-black text-indigo-600 tracking-tighter">
              EXPENSES TRACKER
            </h1>
          </div>

          <div className="mb-10">
            <h2 className="text-5xl font-black text-gray-900 tracking-tight">Log In</h2>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email address</label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
                <Link to="#" className="text-xs font-bold text-indigo-600 hover:underline">Forgot?</Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button with Gradient Styling */}
            <button
              type="submit"
              className="w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-700 text-black text-lg font-bold rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              Sign In <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </form>

          {/* Navigation to Signup */}
          <div className="mt-10 text-center">
            <span className="text-sm text-gray-400 font-medium">Need Account? </span>
            <Link to="/signup" className="text-sm font-bold text-indigo-600 hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>

      {/* 2. Right Section: Decorative Visuals & Illustration */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 w-full h-full">
        
        {/* Background Decorative Circles */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl"></div>

        {/* Illustration Container: Centered using Flexbox */}
        <div className="relative z-10 w-full flex items-center justify-center p-12">
          <div className="w-full max-w-[700px] transition-all duration-500 ease-in-out hover:scale-105">
            <img 
              src={loginImage}
              alt="Login Illustration"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;