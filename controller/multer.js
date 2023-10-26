const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, File, cb) => {
        cb(null, 'public/productimage/')
    },
    filename: (req, File, cb) => {
        let filename = Date.now() + Math.floor(Math.random() * 1000 ** 4) + ".png"
        cb(null, filename);
        req.body.coverImages = filename
    }
})

const multistorage = multer.diskStorage({
    destination: (req, File, cb) => {
        cb(null, 'public/productimage/')
    },
    filename: (req, File, cb) => {
        let filesname = Date.now() + Math.floor(Math.random() * 1000 ** 4) + ".png"+""
        if(!req.session.productname) {
            req.session.productname=[]
        }
        req.session.productname.push(filesname)
        cb(null, filesname);
    }
})


let upload = multer({ storage: storage })
let multiupload = multer({ storage: multistorage })


module.exports = { upload, multiupload }