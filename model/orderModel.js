const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');
const ObjectID = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema({
    userId: ObjectId,
    orderId: String,
    paymentId: String,
    products: [
        {
            productid: String,
            quantity: Number,
            price: Number,
        }
    ],
    AddressId: {
        Firstname: String,
        Lastname: String,
        HouseNo: String,
        Street: String,
        Landmark: String,
        pincode: Number,
        city: String, 
        district: String,
        State: String,
        Country: String,
        phone: Number,
        email: String
    },
    totalPrice: Number,
    couponData: {
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            default: new ObjectId(),
        },
        orginalprice: Number,
    },
    orderDate: {
        type: String,
        default: getDate(0, false),
    },
    confirmDate: {
        type: String,
        default: getDate(7, getDate(0, false))
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'returned'],
        default: 'Pending'
    },
    payment: {
        type: String,
        enum: ['Wallet', 'COD', 'Bank Transfer'],
    },
    paymentStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'success', 'failed','refund'],
    },
    states:{
        type:String,
        enum:['Return','Returned','cancell','cancelled']
    }

})

const Order = mongoose.model('orders', orderSchema);

function getDate(date, fullDay) {
    let currentDate = (!fullDay) ? new Date() : new Date(fullDay);
    currentDate.setDate(currentDate.getDate() + date);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

module.exports = Order