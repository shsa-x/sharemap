import React, { useEffect } from 'react'
import {Page1, Login, Register, Join, Popup, Map} from "../index.jsx"
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function Home() {
  const location = useLocation();
  const isMapActive = useSelector(state => state.locations.isMapActive)

  useEffect(() => {
      // Removed the buggy localStorage map leave check
  }, [location]);

  return (
    <> 
        {isMapActive ? (
            <Map />
        ) : (
            <div className="w-full flex flex-col items-center overflow-x-hidden">
                <Join/>
                <Login  />
                <Register />
                <Popup/>
                
                <div className='w-full'>
                    <Page1/>
                </div>
            </div>
        )}
    </>
  )
}

export default Home
