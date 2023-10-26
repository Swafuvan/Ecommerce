const { userandadminModel, products } = require('../model/database-model')
const database = userandadminModel;
const bcrypt = require('bcrypt');
const sendOtp = require('../model/OTP')


async function homepage(req, res, next) {
    try {
        if(req.session){
            if (req.session.user) {
                let data= await userandadminModel.findOne(req.session.user)
                let details = await products.find()
                res.render('users/Userhomepage', { details,data});
            } else {
                data=false
                let details = await products.find()
                res.render('users/Userhomepage', { details,data});
            }
        }else{
            res.redirect('/login')
        }
        
    } catch (err) {
        console.log(err);
    }
}


function loginpage(req, res, next) {
    if (req.body) {
        if (req.session.user) {
            res.redirect('/')
        } else {
            if (req.session.blockeduser) {
                req.session.blockeduser = false
                res.render('users/userLogin', { blocked: true });
            } else {
                res.render('users/userLogin', { blocked: false });
            }
        }
    }

}

async function loginpost(req, res, next) {
    try {
        const datas = req.body;
        const user = await database.findOne({ email: datas.email });
        if (user) {
            const compared = await bcrypt.compare(datas.password, user.password);
            if (compared) {
                if (user.status) {
                    req.session.user = user;
                    res.redirect('/');
                } else {
                    req.session.blockeduser = true
                    res.redirect('/login');
                }
            } else {
                res.redirect('/login');
            }
        }
    } catch (error) {
        console.error(error);
        res.redirect('/error');
    }
}

function signuppage(req, res, next) {
    if (req.session.user) {
        res.redirect('/');
    } else {
        res.render('users/userSignup')
    }
}


async function signuppost(req, res, next) {
    try {
        if (req.body) {
            const details = req.body;

            if (details.password !== details.confirmpassword) {
                return res.json({ message: 'confirm password not erro' })
            }
            console.log(details);
            details.password = await bcrypt.hash(details.password, 10);
            details.confirmpassword = await bcrypt.hash(details.confirmpassword, 10);
            details.status = true
            const datas = await database.insertMany(details);
            console.log(datas);
            if (datas) {

                if (req.session.otp === req.body.otp) {
                    req.session.user = datas;
                    res.redirect('/');
                }
            } else {
                res.redirect('/signup');
            }
        } else {
            res.redirect('/signup');
        }
    } catch (err) {
        console.log(err);
    }
}


const sendotp = async (req, res, next) => {
    const data = await database.findOne({ email: req.query.email })
    if (data) {
        res.status(400).json({})
    } else {
        req.session.otp = await sendOtp(req.query.email);
        res.status(200).json({ status: true })
    }
}

const shoppage = async (req, res, next) => {
    if (req.session.user) {
        const datas = await products.find()
        let userdata=req.session.user
        res.render('users/shop', { datas,userdata })
    } else {
        res.redirect('/login')
    }
}

const userprofile= async(req,res,next)=>{
    if(req.session.user){
        const userdata=await userandadminModel.findOne(req.session.user)
        res.render('users/userprofile',{userdata})
    }else{
        res.redirect('/login')
    }
}

const usercart= async(req,res,next)=>{
    if(req.session.user){
        const userdata=await userandadminModel.findOne(req.session.user)
        res.render('users/cart',{userdata})
    }else{
        res.redirect('/login')
    }
}

const logout = ((req, res, next) => {
    req.session.destroy()
    res.redirect('/login');
})

function resendotp(req, res, next) {
    setTimeout(() => {
        req.session.otp = null
    }, 1000 * 60)
}


module.exports = { homepage, loginpage, signuppage, loginpost, signuppost, sendotp, shoppage, logout, resendotp 
                 ,userprofile ,usercart }