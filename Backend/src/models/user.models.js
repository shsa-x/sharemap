import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"


const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required: true,
            trim: true,
        },

        username:{
            type:String,
            required:true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password:{
            type: String,
            required: true,
        },
        
        avatar: {
            type: String,
            default: ""
        },
        sessionVersion: {
            type: Number,
            default: 1
        }
    }, 
    {timestamps: true}
)


userSchema.pre("save", async function(next){
    // it will decrypt the password 
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    const payload = {
        _id : this.id,
        username : this.username,
        sessionVersion: this.sessionVersion || 1
    }
    const options = {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    
    return jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_KEY,
        options
    )
}



userSchema.methods.generateRefreshToken = function(){
    const payload = {
        _id : this.id,
    }
    const options = {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    
    return jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_KEY,
        options
    )
}







export const User = mongoose.model("User", userSchema);