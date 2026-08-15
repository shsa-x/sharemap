import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    registerVisibility: "invisible",
    loginVisibility: "invisible",
    joinVisibility: "invisible",
    signBtnName: "Get Started",
    signBtnActive: "true",
    logBtnName: "Log In",
    popupVisibility: "invisible",
    popupHeading: "",
    popupMsg: "All is Well",
    popupColor: "blue"
}

export const visibilitySlice = createSlice({
    name: "visibility",
    initialState,
    reducers:{
        registerVisFunc : (state, action) => {
            state.registerVisibility =  state.registerVisibility === "invisible" ? "visible" : "invisible"
        }, 
        loginVisFunc : (state, action) => {
            state.loginVisibility = state.loginVisibility === "invisible" ? "visible" : "invisible"
        },
        joinVisFunc : (state, action) => {
            state.joinVisibility = state.joinVisibility === "invisible" ? "visible" : "invisible"
        },
       
        popupVisFunc : (state, action) => {
            state.popupVisibility = state.popupVisibility === "invisible" ? "visible" : "invisible"
        }, 
        popupData : (state, action) => {  
            state.popupMsg = action.payload.message
            state.popupHeading = action.payload.heading || ""
            state.popupColor = action.payload.color
        }      
    }
    
})

export const {registerVisFunc, loginVisFunc, joinVisFunc, popupVisFunc,popupData} = visibilitySlice.actions
export default visibilitySlice.reducer