const coupon = require('../model/couponModel')

const couponpage = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const coupons = await coupon.find({})
            console.log(coupons);
            res.render('admin/adminCoupon', { coupons })
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.log(error);
    }
}

const createcoupon = async (req, res, next) => {
    try {
        if (req.session.admin) {
            res.render('admin/addCoupon')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

const couponadding = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const datas = req.body
            console.log(datas);
            let percentageData = {}
            let priceData = {}
            if (datas.offerType === 'percentage') {
                percentageData = {
                    discount: datas.discount,
                    maximum: datas.maximum,
                    minimum: datas.minimum,
                    percentageTill: datas.percentageTill
                }
            } else if (datas.offerType === 'Prices') {
                priceData = {
                    amount: datas.amount,
                    PriceTill: datas.PriceTill
                }
            }

            let mainData = {
                Name: datas.Name,
                description: datas.description,
                valid: datas.valid,
                ExpiryDate: datas.ExpiryDate,
                offerType: datas.offerType,
                percentage: percentageData,
                price: priceData,
            }

            const added = await coupon.insertMany([mainData])
            res.redirect('/admin/coupon')
        }
    } catch (error) {
        console.log(error);
    }
}

const listCoupon = async (req,res,next) => {
    try {
        let {id} = req.body
        let couponData = await coupon.findById(id)
        if(couponData) {
            const list = (couponData.publish) ? false : true
            couponData.publish = list
            couponData.save()
            const code = (list) ? 200 : 201
            res.status(code).json({status:true})
        } else {
            res.status(400).json({status:true})
        }
    } catch (error) {
        res.status(400).json({status:true})
        console.log(error);
    }

}


module.exports = { couponpage, createcoupon, couponadding ,listCoupon}
