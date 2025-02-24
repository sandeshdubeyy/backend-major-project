const asyncHnadler= (requestHandler)=>{
    Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err));

}

export {asyncHnadler}

// const asyncHnadler = ((fn)=>async(eq,res,next)=>{
// try {
    
// } catch (error) {
//     res.status(500).json({
//         success:false,
//         message:"error"
//     });
// }
// })