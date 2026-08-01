import React, { useState, useEffect, useRef, memo } from 'react';
import { Header, MapComponent, Popup } from '../index';
import { useDispatch, useSelector } from 'react-redux';
import { removeUser, resetGroup, setMyLoc, setIsMapActive, removeMessage, setMessage } from '../features/locationSlice';
import { useSocket } from "../hooks/useSocket.js";
import { popupData, popupVisFunc } from '../features/visibilitySlice.js';
import { useNavigate } from 'react-router-dom';
import { encryptData } from '../utils/crypto.js';
import { SERVER_URL } from '../config.js';

function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2-lat1) * (Math.PI/180);
  const dLon = (lon2-lon1) * (Math.PI/180); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

function getBearing(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => deg * Math.PI / 180;
    const toDeg = (rad) => rad * 180 / Math.PI;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δλ = toRad(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);
    
    return (toDeg(θ) + 360) % 360;
}

function Map() {
  const [map, setMap] = useState("satelite");
  const [mapLayer, setMapLayer] = useState("https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg");
  const [popupShown, setPopupShown] = useState(true);
  const [joinFlag, setJoinFlag] = useState(true);
  const [msg, setMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const [path, setPath] = useState([]);
  const [isHidePathVisible, setIsHidePathVisible] = useState(false)
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mapRef = useRef();
  const lastPosRef = useRef(null);
  
  const chatContainerRef = useRef(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const user = useSelector(state => state.locations.user);
  const joinURL = useSelector(state => state.locations.joinURL);
  const joinCode = useSelector(state => state.locations.joinCode);
  const locationObj = useSelector(state => state.locations.group)[user];
  const allMembers = useSelector(state => state.locations.group);
  const waitlist = useSelector(state => state.locations.waitlist);
  const isHost = useSelector(state => state.locations.isHost);
  const isWaiting = useSelector(state => state.locations.isWaiting);
  const hostName = useSelector(state => state.locations.hostName);
  const messages = useSelector(state => state.locations.messages);
  
  const { socketRef, joinRoom, leaveRoom, approveUser } = useSocket();


  const hidePath  = () => {
    setPath([]);
    setIsHidePathVisible(false);
  }

  const changeLayer = (value) => {
    setMap(value);
    setMapLayer(
      value === "satelite" 
        ? "https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg"
        : "https://api.maptiler.com/maps/basic-v2/256/{z}/{x}/{y}.png"
    );
    setMenuOpen(false);
  };

  const showPopup = (message, color) => {
    dispatch(popupData({
      message: message,
      color: color
    }));
    dispatch(popupVisFunc());
    setTimeout(() => {
      dispatch(popupVisFunc());
    }, 3000);
  };

  const sendMsg = () => {
    if (!msg.trim()) return;
    
    const msgId = Date.now() + Math.random();
    const obj = {
      name: user,
      message: msg,
      id: msgId
    };

    socketRef.current.emit("send_message", {
      roomId: joinCode,
      data: encryptData(obj),
    });
    // Add own message locally
    dispatch(setMessage(obj));
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      dispatch(removeMessage(msgId));
    }, 10000);

    setMsg("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMsg();
    }
  };

  const leaveRoomBtn = () => {
    leaveRoom(joinCode, user);
    dispatch(resetGroup());
    dispatch(setIsMapActive(false));
  };

  const copyCodeBtn = () => {
    showPopup("Copied To Clipboard", "green");
    navigator.clipboard.writeText(joinCode);
    setMenuOpen(false);
  };

  const copyURLBtn = () => {
    showPopup("Copied To Clipboard", "green");
    navigator.clipboard.writeText(joinURL);
    setMenuOpen(false);
  };

  const flyOnMap = () => {
    if (!user) {
      showPopup("Login First", "red");
      return;
    }
    if (mapRef.current && locationObj) {
      mapRef.current.flyTo([locationObj.lat, locationObj.long], 18);
    }
  };

  const flyToMember = (member) => {
    if (mapRef.current && member.lat && member.long && member.lat !== -1) {
      mapRef.current.flyTo([member.lat, member.long], 18);
      showPopup(`Flying to ${member.name}`, "blue");
    } else {
      showPopup(`${member.name}'s location unavailable`, "red");
    }
    setShowMembers(false);
    setMenuOpen(false);
  };

  const findPath = async (targetMember) => {
    if (!user) {
      showPopup("Login First", "red");
      return;
    }

    if (!locationObj || locationObj.lat === -1) {
      showPopup("Your location is unavailable", "red");
      return;
    }

    if (!targetMember.lat || targetMember.lat === -1) {
      showPopup(`${targetMember.name}'s location unavailable`, "red");
      return;
    }

    showPopup(`Finding path to ${targetMember.name}...`, "blue");

    const payload = {
        source: {
            lat: allMembers[user].lat,
            lng: allMembers[user].long
        },
        destination: {
            lat: targetMember.lat,
            lng: targetMember.long
        }
    }

    console.log(payload)
    const response = await fetch(`${SERVER_URL}/find-path`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

    // console.log("find path data")
    // console.log(allMembers[user])
    // console.log(targetMember)
    // console.log(payload)

    const result = await response.json()
    const coordinates = [
      { lat: allMembers[user].lat, lng: allMembers[user].long }, 
      ...result.data, 
      { lat: targetMember.lat, lng: targetMember.long }
    ];

    console.log("result from find path : ", coordinates)
    
    setPath([...coordinates]);
    setIsHidePathVisible(true);
    setShowPathFinder(false);
    setMenuOpen(false);
  };

  useEffect(() => {
    const alertUser = () => {
      leaveRoom(joinCode, user);
      dispatch(resetGroup());
    };

    // Handle viewport height changes for mobile browsers
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener("beforeunload", alertUser);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("beforeunload", alertUser);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, [joinCode, user]);

  useEffect(() => {
    localStorage.setItem("lastVisitedPage", "map");
    if (joinCode && joinFlag) {
      joinRoom(joinCode, user);
      setJoinFlag(false);
    }
  }, [joinCode, joinRoom]);

  useEffect(() => {
    const handleUserJoin = (userName) => {
      showPopup(`${userName} join the room`, "blue");
    };

    const handleUserLeave = (userName) => {
      showPopup(`${userName} left the room`, "blue");
      console.log("user room leaved");
      dispatch(removeUser(userName));
    };

    socketRef.current.on("userJoin", handleUserJoin);
    socketRef.current.on("userLeave", handleUserLeave);

    return () => {
      socketRef.current.off("userJoin", handleUserJoin);
      socketRef.current.off("userLeave", handleUserLeave);
    };
  }, [socketRef]);

  useEffect(() => {
    if (user) {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser.');
        return;
      }

      if (popupShown) {
        showPopup("Wait a while...", "blue");
        setPopupShown(false);
      }

      const successCallback = (livePosition) => {
        const currentLat = livePosition.coords.latitude;
        const currentLong = livePosition.coords.longitude;
        const currentTime = Date.now();

        let calculatedSpeed = 0;
        let calculatedHeading = 0;

        if (lastPosRef.current) {
            const timeDiff = (currentTime - lastPosRef.current.time) / 1000;
            if (timeDiff > 0) {
                const dist = getDistanceFromLatLonInM(lastPosRef.current.lat, lastPosRef.current.long, currentLat, currentLong);
                calculatedSpeed = dist / timeDiff;
                calculatedHeading = getBearing(lastPosRef.current.lat, lastPosRef.current.long, currentLat, currentLong);
            }
        }

        lastPosRef.current = { lat: currentLat, long: currentLong, time: currentTime };

        const locationData = {
          name: user,
          lat: currentLat,
          long: currentLong,
          speed: livePosition.coords.speed !== null ? livePosition.coords.speed : calculatedSpeed,
          heading: livePosition.coords.heading !== null ? livePosition.coords.heading : calculatedHeading,
          accuracy: livePosition.coords.accuracy,
          timestamp: currentTime,
          isActive: true,
        };

        dispatch(setMyLoc({
          lat: currentLat,
          long: currentLong,
        }));

        const payload = {
          locationData: encryptData(locationData),
          roomId: joinCode,
        };

        socketRef.current.emit('send_location', payload);
      };

      const errorCallback = (error) => {
        const locationData = {
          name: user,
          lat: -1,
          long: -1,
          isActive: false,
        };
        console.error('Error on location sharing:', error);
        socketRef.current.emit('send_location', locationData);
      };

      const intervalId = setInterval(() => {
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
          enableHighAccuracy: true,
        });
      }, 4000);

      return () => {
        clearInterval(intervalId);
      };
    } else {
      showPopup("Login First", "red");
    }
  }, [dispatch, user, socketRef, joinCode]);

  useEffect(() => {
    // Auto scroll to bottom when a new message arrives, if we are already near the bottom
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isScrolledUp = scrollHeight - (scrollTop + clientHeight) > 50;
      if (!isScrolledUp) {
        chatContainerRef.current.scrollTop = scrollHeight;
      }
    }
  }, [messages]);

  const handleChatScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isScrolledUp = scrollHeight - (scrollTop + clientHeight) > 50;
      setShowScrollBottom(isScrolledUp);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      setShowScrollBottom(false);
    }
  };

  return (
    <>
      <Popup />
      <div className='flex flex-col overflow-hidden' style={{ height: `${viewportHeight}px` }}>

        <div className='flex-1 relative overflow-hidden'>
          
          {/* YouTube-Style Chat Overlay */}
          <div className="absolute top-24 left-4 z-[1000] flex flex-col gap-2 max-w-xs sm:max-w-sm pointer-events-none">
            <div 
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex flex-col gap-2 max-h-64 overflow-y-auto pointer-events-auto"
              style={{ scrollbarWidth: 'none' }}
            >
              {messages.map((msgObj) => (
                <div key={msgObj.id} className="flex items-start gap-2.5 bg-black/40 backdrop-blur-lg rounded-2xl px-3.5 py-2 text-white animate-fadeIn border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 w-fit max-w-[280px] sm:max-w-[320px] hover:bg-black/50">
                  <div className="w-6 h-6 mt-[1px] rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold flex-shrink-0 text-xs shadow-inner ring-1 ring-white/30">
                    {msgObj.senderName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 leading-snug text-[13.5px]">
                    <span className="font-bold text-blue-200 mr-1.5 drop-shadow-sm">{msgObj.senderName}</span>
                    <span className="break-words text-gray-50 font-medium drop-shadow-sm">{msgObj.message}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {showScrollBottom && (
              <button 
                onClick={scrollToBottom}
                className="self-center mt-2 p-2 bg-white/90 text-blue-600 rounded-full shadow-lg pointer-events-auto hover:bg-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            )}
          </div>
          
          {/* My Location Button */}
          <div
            className='absolute top-4 right-4 z-[1000] p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md hover:cursor-pointer'
            onClick={flyOnMap}
          > 
            <img src="https://res.cloudinary.com/dfl8h4on4/image/upload/v1723547535/target_daphlx.png" alt="My Location" className="w-6 h-6" />
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="absolute top-20 right-4 z-[1000] p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md transition-colors duration-200"
            title="Menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-36 right-4 z-[1000] w-64 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
              {/* Map Layer Selection */}
              <div className="border-b border-gray-200">
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                  Map Layer
                </div>
                <button
                  onClick={() => changeLayer("satelite")}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    map === "satelite" ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Satellite Map
                  {map === "satelite" && <span className="float-right">✓</span>}
                </button>
                <button
                  onClick={() => changeLayer("openstreet")}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    map === "openstreet" ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Street Map
                  {map === "openstreet" && <span className="float-right">✓</span>}
                </button>
              </div>

              {/* View Members */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setShowMembers(!showMembers)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 flex items-center justify-between"
                >
                  <span>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    View Members ({Object.keys(allMembers).length})
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showMembers ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMembers && (
                  <div className="bg-gray-50 max-h-48 overflow-y-auto">
                    {Object.values(allMembers).map((member, index) => (
                      <button
                        key={index}
                        onClick={() => flyToMember(member)}
                        className="w-full text-left px-6 py-2 hover:bg-gray-100 transition-colors text-sm text-gray-700 flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {member.name}
                          {member.name === user && <span className="ml-2 text-xs text-blue-600">(You)</span>}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>



              {/* Find Path */}
              <div className="border-b border-gray-200">
                <button
                  onClick={() => setShowPathFinder(!showPathFinder)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700 flex items-center justify-between"
                >
                  <span>
                    <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Find Shortest Path
                  </span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showPathFinder ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPathFinder && (
                  <div className="bg-gray-50 max-h-48 overflow-y-auto">
                    {Object.values(allMembers).filter(member => member.name !== user).map((member, index) => (
                      <button
                        key={index}
                        onClick={() => findPath(member)}
                        className="w-full text-left px-6 py-2 hover:bg-gray-100 transition-colors text-sm text-gray-700 flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          {member.name}
                        </span>
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    ))}
                    {Object.values(allMembers).filter(member => member.name !== user).length === 0 && (
                      <div className="px-6 py-3 text-sm text-gray-500 text-center">
                        No other members available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Room Actions */}
              <div className="border-b border-gray-200">
                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                  Room Actions
                </div>
                <button
                  onClick={copyCodeBtn}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Room Code
                </button>
                <button
                  onClick={copyURLBtn}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors text-gray-700"
                >
                  <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Copy Room URL
                </button>
              </div>

              {/* Leave Room */}
              <button
                onClick={leaveRoomBtn}
                className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors text-red-600 font-medium"
              >
                <svg className="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Leave Room
              </button>
            </div>
          )}

          <div
            className={`absolute top-36 right-4 z-[1000] p-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-md hover:cursor-pointer ${isHidePathVisible ? 'block' : 'hidden'}`}
            title='hide path'
            onClick={hidePath}
          > 
            <img src="https://png.pngtree.com/png-vector/20190419/ourmid/pngtree-vector-cross-icon-png-image_956622.jpg" alt="My Location" className="w-6 h-6" />
          </div>

          <MapComponent mapLayer={mapLayer} mapRef={mapRef} pathCoordinates={path} />

          {/* Reimagined Message Input - Bottom Center */}
          <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-lg px-4'>
            <div className='bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full p-1.5 flex items-center gap-2 transition-all duration-300 focus-within:shadow-[0_8px_30px_rgba(59,130,246,0.2)] focus-within:bg-white/95'>
              <input 
                type="text"
                className='flex-1 bg-transparent px-5 py-3 outline-none text-gray-800 font-medium placeholder-gray-500/80 text-sm md:text-base'
                spellCheck="false"
                placeholder='Type a message...'
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <button
                onClick={sendMsg}
                disabled={!msg.trim()}
                className="p-3 mr-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                <svg className="w-5 h-5 translate-x-[-1px] translate-y-[1px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}

export default Map;