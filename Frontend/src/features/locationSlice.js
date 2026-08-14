import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: "",
    isGuest: false,
    accessToken: "",
    refreshToken: "",
    joinCode: "",
    joinURL : "",
    group:{
    },
    messages: [],
    waitlist: [],
    isWaiting: false,
    isHost: false,
    hostName: "",
    avatar: "",
    isMapActive: false
};

export const locationSlice = createSlice({
    name: 'locations',
    initialState,
    reducers: {
        resetGroup: (state, action) => {
            state.group = {}
            state.joinCode = ""
            state.joinURL  = ""
            state.waitlist = []
            state.isWaiting = false
            state.isHost = false
            state.hostName = ""
            state.avatar = ""
            state.isMapActive = false
        },
        removeUser : (state, action) => {
            
            const user = action.payload
            const {[user]: removedKey, ...newState} = state.group
            state.group = newState
            // console.log(state.group)
        },
        setMyLoc: (state, action) => {
            const obj = {
                name: state.user,
                lat: action.payload.lat,
                long: action.payload.long,
                isActive: true
            }
            // state.group.myself = obj;

            state.group[state.user] = obj
            // const keys = Object.keys(state.group)
            // console.log(keys);
        },
        setJoinCodeURL : (state, action) => {
            state.joinCode = action.payload.joinCode
            state.joinURL = action.payload.joinURL
            // console.log("joincode : ", state.joinCode, "joinURL : ", state.joinURL)
        },
        setMyName : (state, action) => {
            state.user = action.payload
        },
        setAccessAndRefreshToken: (state, action) => {
            state.accessToken = action.payload.accessToken
            state.refreshToken = action.payload.refreshToken
            // console.log(state.accessToken , " " , state.refreshToken)
        },
        updateGroup: (state, action) => {
            //locationData = {
            //    name: "user",
            //    lat: 43.2343
            //    long: 23.5432
            //    isActive: true
            //}
            // console.log(action.payload)
            const name = action.payload.name
            state.group[name] = action.payload
        },
        setMessage: (state, action) => {
            const { name, message, id, avatar } = action.payload;
            state.messages.push({
                id: id,
                senderName: name,
                message: message,
                avatar: avatar
            });
        },
        removeMessage: (state, action) => {
            state.messages = state.messages.filter(msg => msg.id !== action.payload);
        },
        setGuest: (state, action) => {
            state.isGuest = true
        },
        setWaitlist: (state, action) => {
            state.waitlist = action.payload;
        },
        setIsWaiting: (state, action) => {
            state.isWaiting = action.payload;
        },
        setIsHost: (state, action) => {
            state.isHost = action.payload;
        },
        setHostName: (state, action) => {
            state.hostName = action.payload;
        },
        setAvatar: (state, action) => {
            state.avatar = action.payload;
        },
        setIsMapActive: (state, action) => {
            state.isMapActive = action.payload;
        }
        
    }
});

export const { setMyLoc , setMyName, setAccessAndRefreshToken, updateGroup, setJoinCodeURL, resetGroup,setMessage,removeMessage,setGuest, removeUser, setWaitlist, setIsWaiting, setIsHost, setHostName, setAvatar, setIsMapActive } = locationSlice.actions;
export default locationSlice.reducer;
