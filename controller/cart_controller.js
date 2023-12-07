const { ObjectId } = require('mongodb');
const products = require('../model/productModel')
const cart = require('../model/cartModel')
const { default: mongoose } = require('mongoose');

async function getProductDetails(userdata) {
    let userId = new mongoose.Types.ObjectId(userdata)
    return await cart.aggregate([{
        $match: {
            userid: userId,
        }
    }, {
        $unwind: "$products"
    }, {
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

const usercart = async (req, res, next) => {
    if (req.session.user) {
        const data = req.session.user
        const userdata = req.session.user._id
        console.log(userdata);
        let cartdata = await cart.findOne({ userid: userdata });
        cartdata = await getProductDetails(userdata)
        cartdata = cartdata.filter((item) => {
            if (item.cartdetails[0].publish) {
                return true
            }
        })

        const array = totalProductPrice(cartdata)
        let total = getTotal(array)
        req.session.totalcart = total
        if (cartdata) {
            console.log(cartdata);
            res.render('users/cart', { cartdata, userdata, data, array, total })
        } else {
            res.render('users/cart', { cartdata, userdata, data, total })
        }
    } else {
        res.redirect('/login')
    }
}


const addedtocart = async (req, res, next) => {
    try {
        if (req.session.user) {
            const details = req.body;
            let productdata = await products.findById(details.productid)
            console.log(productdata);
            const datas = await cart.findOne({ userid: details.userid })
            if (datas === null) {
                let added = await cart.insertMany({
                    userid: new ObjectId(details.userid),
                    products: [
                        {
                            productid: new ObjectId(productdata._id),
                            quantity: 1,
                            price: productdata.price
                        }
                    ],
                    totalPrice: productdata.price
                })
                console.log(added);
            } else {
                const cartdetails = datas.products.find((data) => {
                    console.log(data.productid + "", productdata._id + "");
                    if (data.productid + "" === productdata._id + "") {
                        data.quantity += 1
                        datas.totalPrice = datas.totalPrice + productdata.price
                        console.log(data);
                        console.log(datas.totalPrice);
                        return true
                    } else {
                        return false
                    }
                })
                if (!cartdetails) {
                    let product = {
                        productid: new ObjectId(productdata._id),
                        quantity: 1,
                        price: productdata.price
                    }
                    datas.products.push(product)
                    datas.totalPrice += productdata.price
                }
                datas.save()
            }
            res.status(200).json({ status: true })
        } else {
            res.status(400).json({ status: true })
        }
    } catch (err) {
        console.log(err);
    }

}


const Quantitychanging = async (req, res, next) => {
    try {
        if (req.session.user) {
            let productData = await products.findById(req.query.prodId)
            const cartdetails = await cart.findOne({
                userid: new mongoose.Types.ObjectId(req.session.user._id),
            })
            let code = 200
            let price = 0
            cartdetails.products.forEach((product) => {
                if (product.productid + '' === productData._id + '') {
                    if (product.quantity === productData.Quantity) {
                        code = 204
                    } else if (productData.Quantity === 0) {
                        code = 205
                    } else if (productData.Quantity < product.quantity) {
                        product.quantity = productData.Quantity
                        code = 203
                    } else {
                        product.quantity += 1
                        price = product.quantity * productData.price
                    }
                    product.price = productData.price
                }
            })
            cartdetails.save()

            console.log(cartdetails);
            const userdata = req.session.user._id
            let cartdata = await cart.findOne({ userid: userdata });
            cartdata = await getProductDetails(userdata)
            const array = totalProductPrice(cartdata)
            console.log(array);
            let total = getTotal(array)
            let result = {
                total:total,
                price:price,
                base: productData.price
            }
            res.status(code).json(result)
        } else {
            res.status(400).json({ status: true })
        }
    } catch (error) {
        console.log(error);
    }
}


const Quantitydecrease = async (req, res, next) => {
    try {
        if (req.session.user) {
            let productData = await products.findById(req.query.prodId)
            const cartdetails = await cart.findOne({
                userid: new mongoose.Types.ObjectId(req.session.user._id),
            })
            let code = 200
            let price = 0
            cartdetails.products.forEach((product) => {
                if (product.productid + '' === productData._id + '') {
                    if (product.quantity < 2) {
                        code = 204
                    } else if (productData.Quantity === 0) {
                        code = 205
                    } else if (productData.Quantity < product.quantity) {
                        product.quantity = productData.Quantity
                        code = 203
                    } else {
                        product.quantity -= 1
                        price = product.quantity * productData.price
                    }
                    product.price = productData.price
                }
            })
            cartdetails.save()
            console.log(price,'wgef uwefjomwerfjiewrhfuryg');
            console.log(cartdetails);
            const userdata = req.session.user._id
            let cartdata = await cart.findOne({ userid: userdata });
            cartdata = await getProductDetails(userdata)
            const array = totalProductPrice(cartdata)
            console.log(array);
            let total = getTotal(array)
            let result = {
                total,
                price,
                base: productData.price
            }
            res.status(code).json(result)
        } else {
            res.status(400).json({ status: true })
        }
    } catch (error) {
        console.log(error);
    }
}


const removecartitem = async (req, res, next) => {
    try {
        if (req.session.user) {
            let userid = req.session.user._id
            let productid = req.query.data
            console.log(productid);
            const details = await cart.findOneAndUpdate({ userid: userid }, {
                $pull: {
                    products: { productid: productid }
                }
            });
            res.redirect('/cart')
        }
    } catch (error) {
        console.log(error);
    }
}

const clearallcart = async (req, res, next) => {
    if (req.session.user) {
        const datas = req.session.user._id;
        await cart.findOneAndUpdate({ userid: datas }, {
            $set: {
                products: []
            }
        })
        res.redirect('/cart');
    }
}



module.exports = { usercart, addedtocart, getProductDetails, Quantitychanging, removecartitem, clearallcart, Quantitydecrease }