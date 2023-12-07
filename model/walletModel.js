const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId:ObjectId,
    Balance:{
        type:Number,
        default: 0,
    },
    transactions:[{
        orderId:String,
        Date:String,
        paymentType:String,
        amount:Number,
    }],

})

const wallet = mongoose.model('wallet',walletSchema)

module.exports= wallet
