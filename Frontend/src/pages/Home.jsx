import React, { useEffect } from 'react'
import {Header, Page1, GroupSetup, Page3, Footer, Login, Register, Join, Popup, Map} from "../index.jsx"
import { useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket.js';
import { useSelector } from 'react-redux';


function Home() {

  const location = useLocation();
  const {leaveRoom} = useSocket()
  const joinCode = useSelector(state => state.locations.joinCode)
  const user = useSelector(state => state.locations.user)
  const isMapActive = useSelector(state => state.locations.isMapActive)

  useEffect(() => {
      // Removed the buggy localStorage map leave check
  }, [location]);


  
  return (
    <> 
        {isMapActive ? (
            <Map />
        ) : (
            <>
                <Join/>
                <Login  />
                <Register />
                <Popup/>
                <div  style={{ position: "sticky", zIndex: 4, top: 0 }} >
                <Header/>
                </div>
                <div className='w-full flex justify-center' >
                    <Page1/>
                </div>

                <div className='w-full flex justify-center' >
                    <GroupSetup/>
                </div>

                <div className='w-full flex justify-center' >
                    <Page3/>
                </div>

                <Footer/>
            </>
        )}
    </>
  )
}

export default Home
