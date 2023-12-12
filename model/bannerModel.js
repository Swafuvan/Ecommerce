const mongoose =require('mongoose')

const bannerSchema =new mongoose.Schema({
    name:String,
    description:String,
    image:String,
    startDate:{
        type:String,
        default:new Date(),
    },
    expiryDate:String,
    publish:{
        type: Boolean,
        default:false
    },
    Links:{
        type:String,
        default:'http://localhost:5000/shop'
    }
})

const banner = mongoose.model('banner',bannerSchema)

module.exports= banner
