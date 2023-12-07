const whishlist =require('../model/whishlistModel');
const Order =require('../model/orderModel');
const products =require('../model/productModel');

const { default: mongoose, Aggregate } = require('mongoose');
const { ObjectId } = require('mongodb');


async function getProductDetails(userdata) {
    let userId = new mongoose.Types.ObjectId(userdata)
    return await whishlist.aggregate([{
        $match:{
            userid:userId
        }
    }, {
        $unwind:"$products"
    }, {
        $lookup:{
            from:"products",
            localField:"products.productid",
            foreignField:"_id",
            as:"whishlistdata"
        }
        
    }])
}

const whishlistpage =async (req,res,next)=>{
    try {
        if(req.session.user){
            const data =req.session.user
            let whishlistdatas=await whishlist.find({userid:data._id})
            console.log(whishlistdatas);
            whishlistdatas=await getProductDetails(data._id)
            res.render('users/whishlist',{data,whishlistdatas})
        }else{
            res.redirect('/login')
        }
    } catch (error) {
       console.log(error); 
    }
}

const whishlistadding=async (req,res,next)=>{
    try {
        if(req.session.user){
            const userdata= req.session.user._id;
            const whishlisted=req.body
            console.log(req.body);
            const productdata=await products.findById(whishlisted.productid)
            console.log(productdata);
            const whishlistdata = await whishlist.findOne({userid:userdata})
            console.log(whishlistdata);
            if(whishlistdata===null){
                let whished = await whishlist.insertMany({
                userid: new ObjectId(whishlisted.userid),
                    products: [
                        {
                            productid: new ObjectId(productdata._id),
                            price: productdata.price
                        }
                    ]
                })
                console.log(whished);
            }
                else {
                    const whishlistdetails = whishlistdata.products.find((data) => {
                        console.log(data.productid+"",productdata._id + "");
                        if (data.productid + "" === productdata._id + "") {
                            console.log(data);
                            return true
                        } else {
                            return false
                        }
                    })
                if(!whishlistdetails) {
                    let product = {
                        productid : new ObjectId(productdata._id),
                        price : productdata.price
                    }
                    whishlistdata.products.push(product)
                }
                console.log(whishlistdata);
                await whishlistdata.save()
            }
            res.status(200).json({ status: true })
        } else {
            res.status(202).json({ status: true })
        }
    } catch (error) {
        console.log(error);
    }
    
}

const removewhishitem =async (req,res,next)=>{
    if(req.session.user){
        const datas=req.query.id
        const userid=req.session.user._id
        console.log(datas);
        const details=await whishlist.findOneAndUpdate({userid:userid},{$pull:{
                products:{productid:datas}
            }
        })
        res.redirect('/whishlist')
        console.log(details);
    }
}


module.exports ={whishlistpage ,whishlistadding , removewhishitem}