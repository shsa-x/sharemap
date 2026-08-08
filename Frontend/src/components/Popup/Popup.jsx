import React from 'react';
import { useSelector } from 'react-redux';

function Popup() {
  const popupColor = useSelector(state => state.visibility.popupColor);
  const popupVisibility = useSelector(state => state.visibility.popupVisibility);
  const popupMsg = useSelector(state => state.visibility.popupMsg);

  const getColorStyles = (color) => {
    const styles = {
      blue: {
        bg: 'bg-white border border-blue-200 shadow-lg text-gray-900',
        icon: (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      red: {
        bg: 'bg-white border border-red-500 shadow-lg text-gray-900',
        icon: (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
        )
      },
      green: {
        bg: 'bg-white border border-green-500 shadow-lg text-gray-900',
        icon: (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    };

    return styles[color.toLowerCase()] || {
      bg: 'bg-white border border-gray-200 shadow-lg text-gray-900',
      icon: (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  };

  const { bg, icon } = getColorStyles(popupColor);

  if (popupVisibility !== 'visible') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60000] animate-slideInRight">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-md ${bg}`}>
        <div className="flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>
        <p className="text-sm font-semibold flex-1">
          {popupMsg}
        </p>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Popup;