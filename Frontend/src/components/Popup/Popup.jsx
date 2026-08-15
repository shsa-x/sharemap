import React from 'react';
import { useSelector } from 'react-redux';

function Popup() {
  const popupColor = useSelector(state => state.visibility.popupColor);
  const popupVisibility = useSelector(state => state.visibility.popupVisibility);
  const popupMsg = useSelector(state => state.visibility.popupMsg);
  const popupHeading = useSelector(state => state.visibility.popupHeading);

  const getColorStyles = (color) => {
    const styles = {
      blue: {
        bg: 'bg-[#1a1b26] border border-[#1a1b26] shadow-lg text-white',
        icon: (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
      red: {
        bg: 'bg-[#1a1b26] border border-red-500/50 shadow-lg text-white',
        icon: (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
        )
      },
      green: {
        bg: 'bg-[#1a1b26] border border-green-500/50 shadow-lg text-white',
        icon: (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    };

    return styles[color.toLowerCase()] || {
      bg: 'bg-[#1a1b26] border border-gray-600 shadow-lg text-white',
      icon: (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    };
  };

  const { bg, icon } = getColorStyles(popupColor);

  if (popupVisibility !== 'visible') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60000] animate-slideInRight">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-md ${bg}`}>
        <div className="flex-shrink-0 flex items-center justify-center mt-0.5">
          {icon}
        </div>
        <div className="flex-1">
          {popupHeading && <h4 className="text-sm font-bold text-white mb-0.5">{popupHeading}</h4>}
          <p className="text-sm font-medium text-white/80">
            {popupMsg}
          </p>
        </div>
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