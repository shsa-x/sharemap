import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js"
import jwt from "jsonwebtoken"


const validateUser = asyncHandler(async(req, res, next) => {
    
    /**
     * algo
     * check cookie
     * no, send error
     * yes, find user
     * find user by payload
     * user eixst 
     * no, send error
     * yes, add user in req field and next
     */
    const accessToken = req.cookies?.accessToken || req.body?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    // console.log(accessToken)
    if(!accessToken){
        return res
        .status(404)
        .json({
            statusCode: 404,
            message: "Invalid Token",
            success: false
        })
    }    
    let decodedToken;
    try {
        decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_KEY);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded._id) {
                await User.findByIdAndUpdate(decoded._id, { $unset: { refreshToken: "" } });
            }
        }
        return res.status(401).json({
            statusCode: 401,
            message: "Invalid or expired token",
            success: false
        });
    }

    // console.log("decoded token :" ,decodedToken)
    const user = await User.findById(decodedToken._id).select("-password -refreshToken")

    if(!user || user.sessionVersion !== decodedToken.sessionVersion){
        return res
        .status(401)
        .json({
            statusCode: 401,
            message: "Session expired or invalid token",
            success: false
        })
    }

    req.user = user
    // console.log(req.user)
    next()
})


export {
    validateUser
}