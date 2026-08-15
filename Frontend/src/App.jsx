import { useState, useEffect } from 'react'
import './App.css'
import {Map, Home, BackgroundBubbles} from './index'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Guest from './pages/Guest';

import { useDispatch } from 'react-redux';
import { setMyName, setAvatar, setIsSessionChecking } from './features/locationSlice';
import { SERVER_URL } from './config';

function App() {
  const dispatch = useDispatch();

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
        dispatch(setIsSessionChecking(false));
      }
    };
    fetchUser();
  }, [dispatch]);

  return (

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jxcd/:groupId" element={<Guest />} />
      </Routes>
    </Router>
  )
}

export default App
