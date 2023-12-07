const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;

const cartSchema = new mongoose.Schema({
    userid: ObjectId,
    products: [
        {
            productid: ObjectId,
            quantity: Number,
            price: Number
        }
    ],
    totalPrice: Number
})

const cart = mongoose.model('carts', cartSchema);

module.exports= cart