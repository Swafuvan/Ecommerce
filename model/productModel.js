const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;

const productSchema = new mongoose.Schema({
    Name: String,
    size: ["M", "L", "XL", "XXL"],
    description: String,
    category: String,
    images: {
        type: [String],
        default: [""]
    },
    coverImages: String,
    publishdate: {
        type: Date,
        default: new Date()
    },
    publish: Boolean,
    price: Number,
    basePrice:Number,
    Quantity: Number,
    Offer:{
        offerType:String,
        offer:Number,
    },
    Color: String,
    For: String,
    review:String
})

const products = mongoose.model('products', productSchema);

module.exports=products