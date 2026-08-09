import { useState, useEffect } from 'react'
import './App.css'
import {Map, Home, BackgroundBubbles} from './index'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Guest from './pages/Guest';

import { useDispatch } from 'react-redux';
import { setMyName, setAvatar } from './features/locationSlice';
import { SERVER_URL } from './config';

function App() {
  const dispatch = useDispatch();
  const [isSessionChecking, setIsSessionChecking] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Ping health endpoint to wake up server
        fetch(`${SERVER_URL}/health`).catch(e => console.error("Health ping failed", e));

        const response = await fetch(`${SERVER_URL}/users/current-user`, {
          method: "GET",
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.data) {
          dispatch(setMyName(data.data.name));
          if (data.data.avatar) dispatch(setAvatar(data.data.avatar));
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      } finally {
        setIsSessionChecking(false);
      }
    };
    fetchUser();
  }, [dispatch]);

  if (isSessionChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-600 font-medium tracking-wide">Loading Map...</span>
        </div>
      </div>
    );
  }

  return (

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jxcd/:joinCode" element={<Guest />} />
      </Routes>
    </Router>
  )
}

export default App
