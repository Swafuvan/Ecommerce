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
})

const banner = mongoose.model('banner',bannerSchema)

module.exports= banner
