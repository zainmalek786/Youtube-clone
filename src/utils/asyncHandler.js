const asyncHandler = (asynchandler)=>{
        return (req,res,next)=>{
        Promise.resolve(
            asynchandler(req,res,next)
        ).catch((err)=> next(err))
    }
}

export {asyncHandler}