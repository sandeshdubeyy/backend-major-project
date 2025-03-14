import multer from "multer";

const strorage = multer.diskStorage({
    destination:function(req,file,cb)
    {
        cb(null,"./public/temp");
    },

    filename: function(req,file,cb)
    {
        cb(null,file.originalname);
    }
});

export const uplaod = multer({
    storage,
});