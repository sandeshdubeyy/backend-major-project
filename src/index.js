import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config(
    {
        path:'./env'
    }
)

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("error : ",error);
        throw error;
    })
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>
{
    console.log("MONGO db connection failed !!!".err);
})





// const app=express()










// ( async()=>
// {
//     try
//     {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on("error",(error)=>
//         {
//             console.log("error : ",error);
//             throw error;

//         })
//         app.listen(process.env.PORT,()=>
//         {
//             console.log(`app is listening on port : ${process.env.PORT}`);
//         })
//     }catch(error)
//     {
//         console.log("ERROR",error);
//         throw error;
//     }

// })()