import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();


// Apply some middlewares
app.use(cors({
    origin: true,
    credentials: true
}))
app.use(express.json({limit: '16kb'}))   
app.use(express.urlencoded({extended: true, limit: '16kb'}))    
app.use(express.static('public')) 
app.use(cookieParser())


/**
 * routers
 */
import userRoutes from "./routes/user.routes.js"
import { findPath } from "./controller/path.controller.js";


app.use("/users", userRoutes)

app.get("/", (req, res) => {
    res.send("All is well!")
})

app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", message: "Server is awake" });
})


app.post("/find-path", findPath)

  













export {app}