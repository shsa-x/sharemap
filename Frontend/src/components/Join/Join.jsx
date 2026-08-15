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
  
  const groupid = useSelector(state => state.locations.groupId);
  const groupurl = useSelector(state => state.locations.groupURL);
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
            <h2 className="text-2xl font-bold text-[#111827]">Share with Friends</h2>
            <p className="text-sm text-gray-500 mt-1">Copy and share to invite others</p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Join URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupurl}
                  disabled
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 font-mono text-sm"
                />
                <button
                  onClick={() => handleCopy(groupurl, 'url')}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none"
                >
                  {copiedField === 'url' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Group ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupid}
                  disabled
                  className="flex-1 px-3 py-2 text-base bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-bold font-mono text-center"
                />
                <button
                  onClick={() => handleCopy(groupid, 'code')}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none"
                >
                  {copiedField === 'code' ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={handleJoinMap}
              className="w-full mt-2 py-2.5 px-4 bg-[#111827] text-white font-medium rounded-lg hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#111827] focus:ring-offset-2 transition-colors duration-200"
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