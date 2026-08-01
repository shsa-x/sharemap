import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { registerVisFunc, joinVisFunc } from '../features/visibilitySlice'
import { useParams } from 'react-router-dom'
import {Header, Page1, GroupSetup, Page3, Footer, Login, Register, Join, Popup, Map} from "../index.jsx"
import { setGuest, setJoinCodeURL } from '../features/locationSlice'


function Guest() {

    const {joinCode} = useParams()
    // if(!(joinCode.includes("sh") && joinCode.length == 12 ))
    console.log(joinCode)
    const dispatch = useDispatch()
    const user = useSelector(state => state.locations.user)


   useEffect(() => {
    if(!user) {
        dispatch(registerVisFunc())
    } else {
        dispatch(joinVisFunc())
    }
       dispatch(setGuest())
       dispatch(setJoinCodeURL({
        joinCode: joinCode, 
        joinURL :`${window.location.origin}/jxcd/${joinCode}` }))
   },[dispatch, user])



  const isMapActive = useSelector(state => state.locations.isMapActive);

  return (
    <>
      {isMapActive ? (
        <Map />
      ) : (
        true || (joinCode.includes("sh") && joinCode.length == 12 ) ? (<> 
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
        </> )  : (
            <div className='text-3xl font-bold text-center mt-[25%]'>
                Invalid URL
            </div>
        )
      )}
    </>
  )
}

export default Guest
