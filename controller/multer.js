const multer = require('multer');
const userandadminModel = require('../model/database-model');


const storage = multer.diskStorage({
    destination: (req, File, cb) => {
        cb(null, 'public/productimage/')
    },
    filename: (req, File, cb) => { 
        let filesnames = Date.now() + Math.floor(Math.random() * 1000 ** 4) + ".png"
        req.session.bannerimg=filesnames
        cb(null, filesnames);
    }
})

const multistorage = multer.diskStorage({
    destination: (req, File, cb) => {
        cb(null, 'public/productimage/')
    },
    filename: (req, File, cb) => {
        let filesname = Date.now() + Math.floor(Math.random() * 1000 ** 4) + ".png"
        if(!req.session.productImage) {
            req.session.productImage = []
        }
        req.session.productImage.push(filesname)
        File.filename = filesname

        cb(null, filesname);
    }
})

const bannerimages = multer.diskStorage({
    destination:(req,File,callback)=>{
        callback(null,'public/bannerimage/')
    },
    filename:(req,File,callback)=>{
        let imagename = Date.now() + Math.floor(Math.random()*1000 ** 4)+'.png'
        req.session.bannerimage=imagename
        callback(null,imagename)
    }
})

const userimagestrg = multer.diskStorage({
    destination:(req,file,callbcak) =>{
        callbcak(null,'public/userimage')
    },
    filename: async(req,file,callback)=>{
        let userfiles = req.session.user._id +'.png'
        let added= await userandadminModel.findByIdAndUpdate(req.session.user._id,{
            $set:{
                Image:userfiles
            }
        })
        callback(null,userfiles)
    }
})    



let userimg = multer({ storage:userimagestrg})
let bannerimg = multer({ storage:bannerimages})
let upload = multer({ storage: storage })
let multiupload = multer({ storage: multistorage })


module.exports = { upload, multiupload,userimg,bannerimg }