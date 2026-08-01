import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { joinVisFunc, popupData, popupVisFunc } from '../../features/visibilitySlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { setMyName, setIsMapActive } from '../../features/locationSlice';
import Popup from '../Popup/Popup';
import Button from '../Button/Button';
import { useSocket } from '../../hooks/useSocket.js';

function Join() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { leaveRoom } = useSocket();
  
  const [copiedField, setCopiedField] = useState(null);
  
  const joincode = useSelector(state => state.locations.joinCode);
  const joinurl = useSelector(state => state.locations.joinURL);
  const user = useSelector(state => state.locations.user);
  const joinVisibility = useSelector(state => state.visibility.joinVisibility);

  const handleClose = () => {
    dispatch(joinVisFunc());
    if (location.pathname.startsWith('/jxcd')) {
      navigate('/');
    }
  };

  const showPopup = (message, color) => {
    dispatch(popupData({ message, color }));
    dispatch(popupVisFunc());
    setTimeout(() => {
      dispatch(popupVisFunc());
    }, 3000);
  };

  const handleCopy = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showPopup("Copied to clipboard!", "green");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      showPopup("Failed to copy", "red");
    }
  };

  const handleJoinMap = () => {
    dispatch(joinVisFunc());
    dispatch(setIsMapActive(true));
    navigate("/");
  };

  useEffect(() => {
  }, [location]);

  if (joinVisibility !== 'visible') return null;

  return (
    <>
      <Popup />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
        <div 
          className="absolute inset-0" 
          onClick={handleClose}
          aria-hidden="true"
        />

        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all animate-slideUp">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="pt-8 pb-6 px-8 text-center border-b border-gray-100">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <img 
                  className="w-10 h-10" 
                  src="https://res.cloudinary.com/dfl8h4on4/image/upload/v1727085429/share_akcqet.png" 
                  alt="ShareMap Logo" 
                />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Share with Friends</h2>
            <p className="text-sm text-gray-500 mt-1">Copy and share to invite others</p>
          </div>

          <div className="p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Join URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinurl}
                  disabled
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-mono"
                />
                <button
                  onClick={() => handleCopy(joinurl, 'url')}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {copiedField === 'url' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Join Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joincode}
                  disabled
                  className="flex-1 px-3 py-2 text-lg bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-bold font-mono text-center"
                />
                <button
                  onClick={() => handleCopy(joincode, 'code')}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {copiedField === 'code' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleJoinMap}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02]"
            >
              Join Map
            </button>
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
    </>
  );
}

export default Join;