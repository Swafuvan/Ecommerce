const mongoose = require("mongoose");
const {ObjectId} = require ('mongodb')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: Number,
        unique: true,
        required: true,

    },
    password: {
        type: String,
        required: true,
    },
    confirmpassword: {
        type: String,
        required: true,
    },
    Address:{
        type:String,
        firstname:String,
        lastname:String,
        country:String,
        state:String,
        pincode:Number,
        
    },
    admin: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    joinDate: {
        type: Date,
        default: new Date()
    },
    Image: String,
});

const categorySchema = new mongoose.Schema({
    category: String,
    Name: String,
    description: String,
    publish: Boolean,
    featured: {
        type: [String],
    },
    popular: {
        type: [String]
    },

});

const productSchema = new mongoose.Schema({
    Name: String,
    size: [String],
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
    Quantity: Number,
    Color: String,
    For: String
})

const cartSchema = new mongoose.Schema({
    userid:ObjectId,
    products:[
        {
            productid:ObjectId,
            quantity:Number,
            price:Number
        }
    ],
    totalPrice:Number
})

const userandadminModel = mongoose.model('users', userSchema);
const categories = mongoose.model('categories', categorySchema);
const products = mongoose.model('products', productSchema);
const cart =mongoose.model('carts',cartSchema);

module.exports = { userandadminModel, categories, products , cart };