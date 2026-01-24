import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

import loginImage from '../images/login_image.png';
import { ChevronRight } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API Gateway -> User Service (/signup)
      await api.post('/users/signup', { email, password });
      alert('Registration Successful! Please log in.');
      navigate('/login');
    } catch (err) {
      alert('Sign Up Failed: ' + (err.response?.data?.error || 'Server Error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Main container matching the 1:1 grid layout
    <div className="grid min-h-screen w-full lg:grid-cols-2 bg-white overflow-hidden">
      {/* 1. Left Section: Sign Up Form */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-white w-full">
        <div className="w-full max-w-md">
          {/* Logo and Header */}
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-xl font-black text-indigo-600 tracking-tighter">
              EXPENSES TRACKER
            </h1>
          </div>

          <div className="mb-10">
            <h2 className="text-5xl font-black text-gray-900 tracking-tight">
              Sign Up
            </h2>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Email address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a strong password"
                className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button with same styling as Login */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center py-4 bg-indigo-600 hover:bg-indigo-700 text-black text-lg font-bold rounded-2xl shadow-lg transition-transform active:scale-95 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : 'Create Account'}{' '}
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </form>

          {/* Navigation to Login */}
          <div className="mt-10 text-center">
            <span className="text-sm text-gray-400 font-medium">
              Already have an account?{' '}
            </span>
            <Link
              to="/login"
              className="text-sm font-bold text-indigo-600 hover:underline"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Right Section: Decorative Visuals (Same as Login) */}
      <div className="hidden lg:flex relative items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700 w-full h-full">
        {/* Background Decorative Circles */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-3xl"></div>

        {/* Illustration Container */}
        <div className="relative z-10 w-full flex items-center justify-center p-12">
          <div className="w-full max-w-[700px] transition-all duration-500 ease-in-out hover:scale-105">
            <img
              src={loginImage}
              alt="Sign Up Illustration"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
