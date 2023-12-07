const { default: mongoose } = require('mongoose');
const userandadminModel = require('../model/database-model');
const Order =require('../model/orderModel')
const database = userandadminModel;
const bcrypt = require('bcrypt');
const products = require('../model/productModel');
const wallet = require('../model/walletModel');
const fs = require('fs');
const PDFDocument = require('pdfkit');



async function adminhome(req, res, next) {
    if (req.session.admin) {
        const orderdetails= await Order.find().sort({_id:-1}).limit(15)
        res.render('admin/adminHome',{orderdetails})
    } else {
        res.redirect('/admin/login')
    }
}

function adminlogin(req, res, next) {
    if (req.session.admin) {
        res.redirect('/admin')
    } else {
        console.log(req.session.check);
        if(req.session.check){
            req.session.check = false
            res.render('admin/adminLogin',{check:true})
        }else{

        res.render('admin/adminLogin',{check:false});
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
            }else{
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
        let datas = await database.find({ admin: admin = false }).sort({ username: 1 }).limit(10);
        if (datas) {
            datas = req.session.productPagination || datas
            let current = req.session.currentPage || 1
            res.render('admin/User-Management', { datas ,current})
        } else {
            res.redirect('/admin/login')
        }
    } else {
        res.redirect('/admin/login');
    }
}

async function adminPaginationusr(req,res,next){
    try {
        if (req.session.admin) {
            let prod = null
            let page = Number(req.query.page)
            if (page) {
                let curr = Number(req.query.current) + page
                prod = (Number(curr) * 10) - 10
                req.session.currentPage =  curr
            } else {
                prod = (Number(req.query.value) * 10) - 10
            }
            req.session.productPagination = await database.find().skip(prod).limit(10)

            res.redirect('/admin/usermanagement')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
}

async function salesreporting(req,res,next){
    try {
        if(req.session.admin){
        const {startDate,endDate} =req.body
        

        // Create a PDF document
        const doc = new PDFDocument();

        // Pipe the PDF content to a writable stream (in this case, a file)
        const writeStream = fs.createWriteStream('output.pdf');
        doc.pipe(writeStream);

        // Add content to the PDF
        doc
        .fontSize(20)
        .text('Hello, this is a PDF generated using pdfkit!', 100, 100);

        // Finalize the PDF
        doc.end();

        writeStream.on('finish', () => {
        console.log('PDF created successfully.');
        });

        writeStream.on('error', (err) => {
        console.error('Error creating PDF:', err);
        });

            
        }else{
            res.redirect('/admin/login')
        }
    } catch (error) {
        
    }
    
}

async function adminPagination(req,res,next){
    try {
        if (req.session.admin) {
            let prod = null
            let page = Number(req.query.page)
            if (page) {
                let curr = Number(req.query.current) + page
                prod = (Number(curr) * 10) - 10
                req.session.currentPage =  curr
            } else {
                prod = (Number(req.query.value) * 10) - 10
            }
            req.session.productPagination = await Order.find().skip(prod).limit(10)

            res.redirect('/admin/orders')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
}



async function blockuser(req, res, next) {
    if(req.session.admin){
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
    }else{
        res.redirect('/admin/login')
    }
    
}

const editorderdetails= async (req,res,next)=>{
    try {
        const details=req.body.status
        const datas=req.params.productid
        const changeorder=await Order.findByIdAndUpdate(datas,{
            $set:{
                status:details
            }
        })
        res.status(200).json({status:true})
    } catch (error) {
        console.log(error);
    }
}

async function orderdetails(req, res, next) {
    if (req.session.admin) {
        let orderdetails = await Order.find().sort({_id:-1}).limit(10)
        orderdetails = req.session.productPagination || orderdetails
        let current = req.session.currentPage || 1
        res.render('admin/order',{orderdetails,current})
    } else {
        res.redirect('/admin/login');
    }
}

 async function orderdetailpage(req,res,next){
    try {
        if(req.session.admin){
            const datas=req.query.id
            let orders=await Order.findOne({_id:new mongoose.Types.ObjectId(datas)})
            await Promise.all(orders.products.map(async(item,index)=>{
                let image = await products.findById(item.productid)
                orders.products[index].coverImages = image.coverImages
            }))
          
            console.log(orders.products[0].img,orders.products[0]);
            res.render('admin/viewOrderDetails',{orders})
        }else{
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
   
 }

async function bannerManagement(req,res,next){
    try {
        if(req.session.admin){
            res.render('admin/banner')
        }else{
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
    
}

async function returnorders(req,res,next){
    try {
        if(req.session.admin){
            const ordrid =req.query.id
            console.log(ordrid);
            const details = await Order.findByIdAndUpdate(ordrid,{
                $set:{
                    states:'Returned'
                }
            })
            console.log(details);
            const totalamount =details.totalPrice
            const userid =details.userId
            console.log(userid);
            console.log(totalamount);
            let walletTrs={
                Date:new Date().toLocaleDateString(),
                paymentType:'Credited',
                amount:totalamount
            }
            const accepted = await wallet.findOneAndUpdate({userId:userid},{
                $inc:{
                    Balance:totalamount
                },$push:{
                    transactions:walletTrs
                }
            })
            
            console.log(accepted);
            if(accepted){
                res.status(203).json({status:true})
            }
        }
    } catch (error) {
        
    }
}

async function cancelOrder(req,res,next){
    try {
        if(req.session.admin){
            const details= req.query.id
            const orderData = await Order.findByIdAndUpdate(details,{
                $set:{
                    states:'cancelled'
                }
            })
            console.log(orderData);
            let walletTrs={
                Date:new Date().toLocaleString(),
                paymentType:'Credited',
                amount:orderData.totalPrice
            }
            if(orderData.payment ==='Bank Transfer'){
                const refund =await wallet.findOneAndUpdate({userId:orderData.userId},{
                    $inc:{
                        Balance:orderData.totalPrice
                    },$push:{
                        transactions:walletTrs
                    }
                })
            }
            res.status(204).json({status:true})
        }
    } catch (error) {
        console.log(error);
    }
}

async function addbannerManagement(req,res,next){
    try {
        if(req.session.admin){
            res.render('admin/addBanner')
        }else{
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
    
}

function adminlogout(req, res, next) {
    req.session.admin=false
    res.redirect('/admin/login');
} 


module.exports = { adminhome, adminlogin, adminlogpost, adminlogout, usermanagement, blockuser, orderdetails ,
                 orderdetailpage, editorderdetails, bannerManagement, addbannerManagement, returnorders ,
                 cancelOrder , adminPagination ,adminPaginationusr ,salesreporting}