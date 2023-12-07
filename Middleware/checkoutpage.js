const Order = require("../model/orderModel");


const paymentChecking =async (req,res,next)=>{
    if(req.session.user){
        const {response} =req.body;
        let datas=req.session.order
        datas.paymentId=response.razorpay_payment_id
        const data = await Order.insertMany([datas])
        console.log(data[0].orderId);
        if (data[0].payment === 'Bank Transfer') {
            const orderstatus = await Order.findOneAndUpdate({orderId:data[0].orderId}, {
                $set: {
                    paymentStatus: 'success'
                }
            })
        }
        res.status(200).json({status:true,order:data[0]})
    }
}

module.exports ={paymentChecking}