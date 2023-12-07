const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;

const whishlistSchema =new mongoose.Schema({
    userid:ObjectId,
    products:[
        {
            productid:ObjectId,
            price:Number,
        }
    ]
})

let whishlist = mongoose.model('whishlists',whishlistSchema);

module.exports = whishlist