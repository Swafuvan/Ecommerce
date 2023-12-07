const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    Name: String,
    description: String,
    create: {
        type: String,
        default: new Date()
    },
    ExpiryDate: String,
    publish: {
        type: Boolean,
        default: false
    },
    offerType: String,
    percentage: {
        discount: Number,
        minimum: Number,
        maximum: Number,
        percentageTill: {
            type: Number,
        },
    },
    price: {
        amount: Number,
    },
    valid: Number

})

const Coupon = mongoose.model('Coupon', couponSchema)

module.exports = Coupon

function getDate(date, fullDay) {
    let currentDate = (!fullDay) ? new Date() : new Date(fullDay);
    currentDate.setDate(currentDate.getDate() + date);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}