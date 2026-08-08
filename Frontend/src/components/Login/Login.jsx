import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerVisFunc, loginVisFunc, popupData, popupVisFunc, joinVisFunc } from '../../features/visibilitySlice';
import { setMyName, setAccessAndRefreshToken, setAvatar } from '../../features/locationSlice.js';
import Input from '../Input/Input.jsx';
import Button from '../Button/Button.jsx';
import { useSocket } from '../../hooks/useSocket.js';
import { SERVER_URL } from '../../config.js';

function Login() {
  const dispatch = useDispatch();
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const isGuest = useSelector(state => state.visibility.isGuest);
  const loginVisibility = useSelector(state => state.visibility.loginVisibility);
  const joinCode = useSelector(state => state.locations.joinCode);
  const user = useSelector(state => state.locations.user);
  
  const { leaveRoom } = useSocket();

  const handleClose = () => {
    dispatch(loginVisFunc());
    setUserName("");
    setPassword("");
  };

  const handleRegisterClick = () => {
    dispatch(loginVisFunc());
    dispatch(registerVisFunc());
    setLoading(false);
  };

  const showPopup = (message, color) => {
    dispatch(popupData({ message, color }));
    dispatch(popupVisFunc());
    setTimeout(() => {
      dispatch(popupVisFunc());
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      showPopup("Please fill in all fields", "red");
      return;
    }

    setLoading(true);

    const credentials = {
      username: username.trim(),
      password: password,
    };

    try {
      const response = await fetch(`${SERVER_URL}/users/login`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        if (isGuest) dispatch(joinVisFunc());
        showPopup("Welcome back! 🎉", "green");
        dispatch(setMyName(data.data.user.name));
        dispatch(setAvatar(data.data.user.avatar || ""));
        dispatch(setAccessAndRefreshToken({
          accessToken: data.data.accessToken,
          refreshToken: data.data.refreshToken
        }));
        handleClose();
      } else {
        showPopup(data.message, "red");
      }
    } catch (error) {
      showPopup("Something went wrong! Please try again", "red");
    }

    setUserName("");
    setPassword("");
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit();
    }
  };

  if (loginVisibility !== 'visible') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500/50 backdrop-blur-sm animate-fadeIn">
      <div 
        className="absolute inset-0" 
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[400px] bg-white rounded-[1rem] shadow-xl transform transition-all animate-slideUp overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="pt-8 pb-5 px-6 text-center border-b border-gray-100">
          <h2 className="text-2xl font-bold text-[#111827]">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to continue sharing</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-sm placeholder:text-gray-400"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your password"
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-sm placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-[#111827] text-white font-medium rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#111827] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </button>
        </div>

        <div className="px-6 pb-6 text-center">
          <p className="text-sm font-semibold text-gray-700">
            Don't have an account?{' '}
            <button
              onClick={handleRegisterClick}
              className="text-blue-600 font-bold hover:underline transition-colors duration-200 focus:outline-none"
              disabled={isLoading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Login;