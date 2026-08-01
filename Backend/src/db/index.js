import mongoose from "mongoose"
import  {db_name} from "../constants.js"

export const connectDB = async() => {
    try {
        const connectionObj = await mongoose.connect(`${process.env.MONGODB_URI}/${db_name}`);
        console.log(`\n MongoDB connected !! DB HOST : ${connectionObj.connection.host}`)
    } catch (error) {
        console.error("Database connection failed!", error)
        process.exit(1);
    }

}