const { default: mongoose } = require('mongoose');
const userandadminModel = require('../model/database-model');
const Order = require('../model/orderModel')
const database = userandadminModel;
const bcrypt = require('bcryptjs');
const products = require('../model/productModel');
const wallet = require('../model/walletModel');
const fs = require('fs');
const PDFDocument = require('pdfkit-table');
const banner = require('../model/bannerModel');
const categories = require('../model/categoryModel');



async function adminhome(req, res, next) {
    if (req.session.admin) {
        const users = await userandadminModel.find().sort({ _id: -1 }).limit(5)
        const orderdetails = await Order.find({}).sort({ _id: -1 }).limit(10)
        const ordersdata = await Order.find({}).sort({ _id: -1 })

        let countDelivered = Array(12).fill(0);
        let countCanceled = Array(12).fill(0);
        let totalCountByMonth = Array(12).fill(0);
        let allOrders = ordersdata;
        let deliveredData = ordersdata.filter((item) => item.status === 'Delivered');

        // Count delivered orders by month
        deliveredData.forEach((order) => {
            let ordDate = order.orderDate.split('-');
            let monthIndex = parseInt(ordDate[1], 10) - 1;

            if (monthIndex >= 0 && monthIndex < countDelivered.length) {
                countDelivered[monthIndex] += 1;
            }
        });

        // Filter canceled orders
        let canceledData = ordersdata.filter((item) => item.status === 'Cancelled');

        // Count canceled orders by month
        canceledData.forEach((order) => {
            let ordDate = order.orderDate.split('-');
            let monthIndex = parseInt(ordDate[1], 10) - 1;

            if (monthIndex >= 0 && monthIndex < countCanceled.length) {
                countCanceled[monthIndex] += 1;
            }
        });
        allOrders.forEach((order) => {
            let ordDate = order.orderDate.split('-');
            let monthIndex = parseInt(ordDate[1], 10) - 1;
        
            if (monthIndex >= 0 && monthIndex < totalCountByMonth.length) {
                totalCountByMonth[monthIndex] += 1;
            }
        });
        console.log(allOrders);
        console.log(canceledData);
        console.log(deliveredData);

        let TotalDatas={}
         TotalDatas.revenue=0
          ordersdata.forEach((odr) => {
             TotalDatas.revenue+=odr.totalPrice
        })
        TotalDatas.productcount = await products.countDocuments()
        TotalDatas.orders=await Order.countDocuments()
        TotalDatas.category = await categories.countDocuments()
        
        res.render('admin/adminHome', { orderdetails, users, totalCountByMonth, countDelivered, countCanceled, TotalDatas })
    } else {
        res.redirect('/admin/login')
    }
}

function adminlogin(req, res, next) {
    if (req.session.admin) {
        res.redirect('/admin')
    } else {
       
        if (req.session.check) {
            req.session.check = false
            res.render('admin/adminLogin', { check: true })
        } else {

            res.render('admin/adminLogin', { check: false });
        }
    }
}

async function adminlogpost(req, res, next) {
    if (req.body.email && req.body.password !== "") {
        const datas = await database.findOne({ email: req.body.email })
        if (datas.admin) {
            const check = await bcrypt.compare(req.body.password, datas.password);
            if (check) {
                req.session.admin = datas;
                res.redirect('/admin');
            } else {
                req.session.check = true;
                res.redirect('/admin/login')
            }
        } else {
            res.redirect('/admin/login')
        }
    } else {
        res.redirect('/admin/login')
    }
}

async function usermanagement(req, res) {
    if (req.session.admin) {
        let datas = await database.find({ admin: false }).sort({ username: 1, _id: -1 }).limit(10);
        if (datas) {
            datas = req.session.productPagination || datas
            let current = req.session.currentPage || 1
            res.render('admin/User-Management', { datas, current })
        } else {
            res.redirect('/admin/login')
        }
    } else {
        res.redirect('/admin/login');
    }
}

async function adminPaginationusr(req, res, next) {
    try {
        if (req.session.admin) {
            let prod = null
            let page = Number(req.query.page)
            if (page) {
                let curr = Number(req.query.current) + page
                prod = (Number(curr) * 10) - 10
                req.session.currentPage = curr
            } else {
                prod = (Number(req.query.value) * 10) - 10
            }
            req.session.productPagination = await database.find().skip(prod).limit(10).sort({ _id: -1 })

            res.redirect('/admin/usermanagement')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
}


const salesreporting = async (req, res, next) => {
    const { startDate, endDate } = req.body
    const reportData = await salesReportData(startDate, endDate);

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Sales_report.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text(`Monthly Sales Report ${startDate} to ${endDate}`);
    doc.moveDown(2);

    doc.fontSize(12).text('Company Name: Colours Pardha Palace');
    doc.fontSize(12).text('Sales Report From: ' + startDate);
    doc.fontSize(12).text('Sales Report Till: ' + endDate);
    doc.fontSize(12).text('Total Orders: ' + reportData.count);
    doc.fontSize(12).text('Total Users: ' + reportData.users);
    doc.fontSize(12).text('Total Products: ' + (await products.find()).length);
    doc.fontSize(12).text('Average Sales Total Increase: ' + reportData.average);
    doc.fontSize(12).text(`Revenue from ${startDate} to ${endDate} :` + reportData.revenue);
    doc.fontSize(12).text('Total Revenue: ' + reportData.total + ' /-');
    doc.moveDown(2);

    const orders = reportData.orders;


    const table = {
        headers: ['User Name', 'Order ID', 'Quantity', 'Price'],
        rows: orders.map((item) => [
            item.AddressId.Firstname,
            item.orderId.toString(),
            item.products.length.toString(),
            item.totalPrice.toString(),
        ]),
    };

    doc.table(table, {
        width: 600,
        headerLines: 1,
        align: 'center',
    });

    doc.end();
};


async function salesReportData(startDate, endDate) {
    const order = await Order.find({
        status: 'Delivered', orderDate: {
            $gte: startDate,
            $lte: endDate
        }
    })
    const ordersdata = await Order.find({ status: 'Delivered' })
    let salesDetails = {}
    salesDetails.count = order.length
    salesDetails.users = await userandadminModel.countDocuments()
    salesDetails.average = (order.length / ordersdata.length) * 100
    salesDetails.total = 0
    ordersdata.forEach((odr) => {
        salesDetails.total += odr.totalPrice
    })
    salesDetails.revenue = 0
    order.forEach((odr) => {
        salesDetails.revenue += odr.totalPrice
    })
    salesDetails.orders = order

    return salesDetails


}


async function adminPagination(req, res, next) {
    try {
        if (req.session.admin) {
            let prod = null
            let page = Number(req.query.page)
            if (page) {
                let curr = Number(req.query.current) + page
                prod = (Number(curr) * 10) - 10
                req.session.currentPage = curr
            } else {
                prod = (Number(req.query.value) * 10) - 10
            }
            req.session.productPagination = await Order.find().skip(prod).limit(10).sort({ _id: -1 })

            res.redirect('/admin/orders')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
}



async function blockuser(req, res, next) {
    if (req.session.admin) {
        let userData = await database.findByIdAndUpdate(req.body.userid);
        if (userData.status === true) {
            userData.status = false;
            await userData.save()
            res.status(200).json({ status: true })
        } else {
            userData.status = true
            await userData.save()
            res.status(201).json({ status: true })
        }
    } else {
        res.redirect('/admin/login')
    }

}

const editorderdetails = async (req, res, next) => {
    try {
        const details = req.body.status
        const datas = req.params.productid
        const changeorder = await Order.findByIdAndUpdate(datas, {
            $set: {
                status: details
            }
        })
        if(changeorder.status==='Delivered' && changeorder.payment==='COD'){
            changeorder.paymentStatus='success'
        }else if(changeorder.status==='Cancelled' && changeorder.payment==='Bank Transfer'){
            changeorder.paymentStatus='refund'
        }else if( changeorder.status==='Cancelled' && changeorder.payment==='COD'){
            changeorder.paymentStatus='refund'
        }
        changeorder.save()
        console.log(changeorder);
        res.status(200).json({ status: true })
    } catch (error) {
        console.log(error);
    }
}

 
async function orderdetails(req, res, next) {
    if (req.session.admin) {
        let search = '^' +req.query.search
        search.trim()
        console.log(search, req.query);
        let orderdetails;
        if (req.query.search) {
            if (req.query.search !== '') {
                console.log(req.query.search,search);
                orderdetails = await Order.find({
                    $and: [  
                        {         
                            $or: [
                                { orderId: { $regex: search, $options: 'i' } },
                                { 'AddressId.Firstname': { $regex: search, $options: 'i' } },
                            ]
                        }
                    ]
                })
                orderdetails = req.session.productPagination || orderdetails
                let current = req.session.currentPage || 1
                res.render('admin/order', { orderdetails, current })
            }
        } else {
            orderdetails = await Order.find().sort({ _id: -1 }).limit(10)
            orderdetails = req.session.productPagination || orderdetails
            let current = req.session.currentPage || 1
            res.render('admin/order', { orderdetails, current })
        }

    } else {
        res.redirect('/admin/login');
    }
}

async function orderdetailpage(req, res, next) {
    try {
        if (req.session.admin) {
            const datas = req.query.id
            let orders = await Order.findOne({ _id: new mongoose.Types.ObjectId(datas) })
            await Promise.all(orders.products.map(async (item, index) => {
                let image = await products.findById(item.productid)
                orders.products[index].coverImages = image.coverImages
            }))

            console.log(orders.products[0].img, orders.products[0]);
            res.render('admin/viewOrderDetails', { orders })
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

async function bannerManagement(req, res, next) {
    try {
        if (req.session.admin) {
            const bannerdata = await banner.find({})
            console.log(bannerdata);
           return res.render('admin/banner', { bannerdata })
        } else {
           return res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }
}

async function returnorders(req, res, next) {
    try {
        if (req.session.admin) {
            const ordrid = req.query.id
            console.log(ordrid);
            const details = await Order.findByIdAndUpdate(ordrid, {
                $set: {
                    states: 'Returned',
                    paymentStatus:'refund'
                }
            })
            
            console.log(details);
            const totalamount = details.totalPrice
            const userid = details.userId
            console.log(userid);
            console.log(totalamount);
            let walletTrs = {
                Date: new Date().toLocaleDateString(),
                paymentType: 'Credited',
                amount: totalamount
            }
            const accepted = await wallet.findOneAndUpdate({ userId: userid }, {
                $inc: {
                    Balance: totalamount
                }, $push: {
                    transactions: walletTrs
                }
            })

            console.log(accepted);
            if (accepted) {
                res.status(203).json({ status: true })
            }
        }
    } catch (error) {

    }
}

async function cancelOrder(req, res, next) {
    try {
        if (req.session.admin) {
            const details = req.query.id
            const orderData = await Order.findByIdAndUpdate(details, {
                $set: {
                    states: 'cancelled'
                }
            })
            if(orderData.payment==='Bank Transfer' || orderData.payment==='Wallet'){
                orderData.paymentStatus='refund'
            }
            console.log(orderData);
            let walletTrs = {
                Date: new Date().toLocaleString(),
                paymentType: 'Credited',
                amount: orderData.totalPrice
            }
            if (orderData.payment === 'Bank Transfer') {
                const refund = await wallet.findOneAndUpdate({ userId: orderData.userId }, {
                    $inc: {
                        Balance: orderData.totalPrice
                    }, $push: {
                        transactions: walletTrs
                    }
                })
            }
            res.status(204).json({ status: true })
        }
    } catch (error) {
        console.log(error);
    }
}

function addbannerManagement(req, res, next) {
    try {
        if (req.session.admin) {
            res.render('admin/addBanner')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

async function bannerManagementpost(req, res, next) {
    try {
        if (req.session.admin) {
            const details = req.body
            console.log(req.body.image);
            let datas = {
                name: details.Name,
                description: details.description,
                image: req.session.bannerimage,
                startDate: details.startDate,
                expiryDate: details.ExpiryDate,
                publish: details.publish,
                Links: details.links
            }
            const added = await banner.insertMany([datas])
            console.log(added);
            req.session.bannerimg=null
            res.redirect('/admin/banner')
        }
    } catch (error) {
        console.log(error);
    }
}

async function bannerpublish (req,res){
    try {
        if(req.session.admin){
            const bannerid =req.query.id;
            let published =await banner.findById(bannerid)
            published.publish = (published.publish===true)?false:true
            await published.save()
            res.status(200).json({status:true})
        }
    } catch (error) {
        console.log(error); 
    }
}

function adminlogout(req, res, next) {
    req.session.admin = false
    res.redirect('/admin/login');
}


module.exports = {
    adminhome, adminlogin, adminlogpost, adminlogout, usermanagement, blockuser, orderdetails,
    orderdetailpage, editorderdetails, bannerManagement, addbannerManagement, returnorders,
    cancelOrder, adminPagination, adminPaginationusr, salesreporting, bannerManagementpost ,bannerpublish
}