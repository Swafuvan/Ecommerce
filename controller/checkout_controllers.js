const Order = require('../model/orderModel');
const cart = require('../model/cartModel');
const products = require('../model/productModel');
const Address = require('../model/addressModel');
const coupon = require('../model/couponModel');

const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const Razorpay = require('razorpay');
const userandadminModel = require('../model/database-model');
const wallet = require('../model/walletModel');
 require('dotenv').config()

const instance = new Razorpay({
    key_id: process.env.keyId,
    key_secret: process.env.keySecret,
});

async function getProductDetails(userdata) {
    let userId = new mongoose.Types.ObjectId(userdata)
    return await cart.aggregate([{
        $match: {
            userid: userId
        }
    }, {
        $unwind: "$products"
    },
    {
        $lookup: {
            from: 'products',
            localField: 'products.productid',
            foreignField: '_id',
            as: 'cartdetails',
        }
    }
    ])
}

function getTotal(array) {
    return array.reduce((acc, curr) => {
        return acc + curr
    }, 0)
}

function totalProductPrice(cartdata) {
    return cartdata.map((item, index) => {
        return item.products.quantity * item.products.price;
    });
}

function generateRandomOrderId(prefix, length) {
    const characters = '0123456789';
    let randomNumbers = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomNumbers += characters.charAt(randomIndex);
    }
    return prefix + randomNumbers;
}

const checkoutpage = async (req, res, next) => {
    try {
        if (req.session.user) {
            
            const data = req.session.user
            const Addressdata = await Address.findOne({ user: data._id })
            let cartdata = await cart.findOne({ userid: data._id });
            cartdata = await getProductDetails(data._id)
            cartdata = cartdata.filter((item) => {
                if (item.cartdetails[0].publish) {
                    return true
                }
            })

            req.session.cartdetails = cartdata
            const array = await totalProductPrice(cartdata)

            let total = getTotal(array)
            let selectedAddress = [];
            if (Addressdata) {
                selectedAddress = Addressdata.userAddress.map((address) => address.addressType);
            }
            let couponData = req.session.coupon
            if (req.session.coupon) {
                if (couponData.offerType === 'percentage') {
                    if (couponData.percentage.percentageTill >= total) {
                        req.session.discount = (total * couponData.percentage.discount) / 100
                        total = total - req.session.discount
                    } else {
                        req.session.discount = couponData.percentage.maximum
                        total = total - req.session.discount
                    }
                } else {
                    req.session.discount = couponData.price.amount
                    total = total - req.session.discount
                }
            }
            req.session.totalPrice = total
            let couponamount = req.session.discount
            couponamount = (req.session.coupon) ? couponamount : "";
            res.render('users/checkout', { data, cartdata, array, total, Addressdata, selectedAddress, couponamount })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }
}

const placeorders = async (req, res, next) => {
    try {
        if (req.session.user) {
      
            const allCartdata = req.session.cartdetails
            const user = req.session.user._id
            const cartTotal = req.session.totalPrice
            const couponData = req.session.coupon
            let userAddress = await Address.findOne({ user: user })
            const payment = req.body.checkedvalues
            const Orderid = generateRandomOrderId('ORD', 7);
            let productData = allCartdata.map((item) => {
                return item.products
            })
            let couponDetails = {}
            if (couponData) {
                couponDetails = {
                    couponId: couponData._id,
                    orginalprice: cartTotal + req.session.discount
                }
            }
            

            userAddress = userAddress.userAddress[0]

            const order = {
                paymentId: (payment === 'Wallet') ? 'Wallet' : 'COD',
                orderId: Orderid,
                AddressId: userAddress,
                products: productData,
                totalPrice: cartTotal,
                userId: new mongoose.Types.ObjectId(user),
                payment: payment,
                couponData: couponDetails
            }

            if (payment === "COD") {
                await Order.insertMany([order])
                return res.status(200).json({ status: true, order })
            } else if (payment === "Bank Transfer") {
                console.log(payment);
                req.session.order = order
                let total = order.totalPrice * 100
                generateOrder(order.orderId, total).then((orders) => {
                    res.status(201).json({ status: true, order: orders })
                })
            } else if (payment === "Wallet") {
                let walletamt = await wallet.findOne({userId:order.userId})
                console.log(walletamt);
                if( order.totalPrice <= walletamt.Balance  ){
                    let checkoutdata = await Order.insertMany([order])
                    let walletamt = await wallet.findOneAndUpdate({userId:order.userId},{
                        $set:{userId:checkoutdata[0].userId},
                        $inc:{Balance:-checkoutdata[0].totalPrice},
                    })
                    walletamt.transactions.push({
                        orderId:checkoutdata[0]._id,
                        amount:checkoutdata[0].totalPrice,
                        Date:new Date().toLocaleString(),
                        paymentType:'Debit'
                    })
                    walletamt.save()
                    res.status(203).json({ status: true,order:checkoutdata[0]._id })
                }else{
                    res.status(208).json({status:true})
                }
                
            }

        }
    } catch (error) {
        console.log(error);
    }
}

function generateOrder(id, total) {
    return new Promise((resolve, reject) => {
        const options = {
            amount: total,
            currency: "INR",
            receipt: id,
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error(err);
                reject(err);
            }
            console.log(order);
            resolve(order)
        });

    })
}

const confirmorderpage = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userdata = req.session.user._id
            const data = req.session.user
            console.log(req.query);
            const odrid = req.query.id;
            console.log(odrid);

            const cartdataas = await cart.findOneAndUpdate({ userid: userdata }, {
                $set: {
                    products: []
                }
            })
            const productdata = req.session.cartdetails
            let stock = productdata.map(async (item) => {
                let lastdata = await products.findByIdAndUpdate(item.products.productid, {
                    $inc: {
                        Quantity: -item.products.quantity
                    }
                })
            })
           
            
            res.render('users/confirm-order', { data })
            req.session.cartdetails = null
            req.session.order = null
            req.session.totalPrice = null

        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }

}

const ordercancellation = async (req, res, next) => {
    try {
        if (req.session.user) {
            const orderid = req.body.orderid
           
            const cancelleddata = await Order.findOneAndUpdate({ _id: orderid }, {
                $set: {
                    status: 'Cancelled',
                    states: 'cancell'
                }
            })
            let replaceid = cancelleddata.products.map((data)=>{
                return {id:data.productid,qty:data.quantity}
            })
            console.log(replaceid);
            replaceid.forEach(async (item) => {
                await products.findByIdAndUpdate(item.id, {
                    $inc: {
                        Quantity: item.qty
                    }
                });
            });

           
            res.status(202).json({ status: true })
        }
    } catch (error) {
        console.log(error);
    }

}

const userOrderData = async (req, res, next) => {
    if (req.session.user) {
        const data = req.session.user
        const productdata = req.query.orderid

        const order = await Order.findById(productdata)

        await Promise.all(order?.products.map(async (item, index) => {
            let image = await products.findById(item.productid)
            order.products[index].coverImages = image.coverImages
        }))
        const userRating = ''
        const userReview = ''
        res.render('users/orderDetails', { data, order, userRating, userReview })
    } else {
        res.redirect('/login')
    }
}

const couponverification = async (req, res, next) => {
    try {
        if (req.session.user) {
            const datas = req.body
            const user = req.session.user;
            console.log(datas.coupon);
            const addedcoupon = await coupon.findOne({ Name: datas.coupon })
            const totalData = req.session.totalPrice
            console.log(totalData);
            if (addedcoupon) {
                if (totalData >= addedcoupon.valid) {
                    const userdata = await userandadminModel.findOne({
                        email: user.email,
                        coupon: addedcoupon._id
                    });
                    if (!userdata) {
                        req.session.coupon = addedcoupon
                        res.status(200).json({ status: true })
                    } else {
                        res.status(201).json({ status: true })
                    }
                } else {
                    res.status(202).json({ status: true })
                }
            } else {
                res.status(400).json({ status: true })
            }
        } else {
            res.status(401).json({ status: true })
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({ status: true })
    }

}

const couponremove = (req,res,next)=>{
    try {
        if(req.session.user){
            req.session.coupon=null
            res.status(205).json({status:true})
        }else{
            res.status(400).json({status:true})
        }
    } catch (error) {
        console.log(error);
        res.status(400).json({status:true})
    }
  
}

const returnedOrders = async (req,res,next)=> {
    try {
        if(req.session.user){
            const datas =req.body
            console.log(datas);
            const returns =await Order.findByIdAndUpdate(datas.orderid,{
                $set:{
                    states:"Return",
                    status:"returned"
                }
            })
            console.log(returns);
            let result= returns.products.map((item)=>{
                return {id:item.productid,qnty:item.quantity,amt:item.price}
            })
            let totalamount= result.forEach((dat)=>{
                return dat.amt += dat.amt
            })
             
            result.forEach( async(bata)=>{
                await products.findByIdAndUpdate(bata.id,{
                    $inc:{
                        Quantity:bata.qnty
                    }
                })
            })
            
            res.status(202).json({status:true})
        }else{
            res.status(400).json({status:true})
        }
    } catch (error) {
        console.log(error);
    }
    
}

const deleteOrder = async (req, res, next) => {
    try {
        if (req.session.user) {
            const orderid = req.body.orderid;
            console.log(orderid);
            const after = await Order.findOneAndDelete({ orderId: orderid })
            console.log(after);
            res.status(200).json({ status: true })
        }
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    checkoutpage, placeorders, confirmorderpage, ordercancellation, userOrderData, deleteOrder,
    couponverification ,returnedOrders ,couponremove

}