const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, File, cb) => {
        cb(null, 'public/productimage/')
    },
    filename: (req, File, cb) => { 
        cb(null, File.originalname);
    }
})

const multistorage = multer.diskStorage({
    destination: (req, File, cb) => {
        cb(null, 'public/productimage/')
    },
    filename: (req, File, cb) => {
        let filesname = Date.now() + Math.floor(Math.random() * 1000 ** 4) + ".png"+""
        if(!req.session.productImage) {
            req.session.productImage = []
        }
        req.session.productImage.push(filesname)
        File.filename = filesname
      
        cb(null, filesname);
    }
})


let upload = multer({ storage: storage })
let multiupload = multer({ storage: multistorage })


module.exports = { upload, multiupload }