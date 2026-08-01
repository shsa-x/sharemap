import {configureStore} from '@reduxjs/toolkit'
import locationReducer from "../features/locationSlice.js"
import visibilityFunctions from "../features/visibilitySlice.js"

export default configureStore({
    reducer: {
        locations: locationReducer,
        visibility: visibilityFunctions
    },
})