const userandadminModel = require('../model/database-model');
const Order = require('../model/orderModel');
const products = require('../model/productModel');
const Address = require('../model/addressModel');

const bcrypt = require('bcryptjs');
const { sendOtp, createToken } = require('../model/OTP');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const categories = require('../model/categoryModel');
const wallet = require('../model/walletModel');
const easyinvoice = require('easyinvoice');
const { OAuth2Client } = require('google-auth-library');
const { google } = require('googleapis');
const banner = require('../model/bannerModel');
const Coupon = require('../model/couponModel');
const Contact = require('../model/userContact');
const client = new OAuth2Client(process.env.ClintId, process.env.ClientSecret);



async function homepage(req, res, next) {
    try {
        if (req.session) {
            const details = await products.find({ publish: true })
            const ordersitem = await Order.find()
            const categ = await categories.find({publish:true})
            const banners = await banner.find({ publish: true })
            const coupons =await Coupon.find({publish:true})

            let topSelling = TopSelling(ordersitem)
            topSelling= topSelling.sort((a,b)=>b.count-a.count);
            let mostSold = [];
            let productLimit=4;
            for (const item of topSelling) {
                if (mostSold.length >= productLimit) {
                    break; 
                }
                const product = await products.findById(item.productid);
                mostSold.push(product);
            }

            if (req.session.user) {
                let data = await userandadminModel.findById(req.session.user);
                let ordersdata = await Order.find({ status: 'Delivered' })

                return res.render('users/Userhomepage', { details, data, categ, ordersdata, banners ,mostSold ,coupons});
            } else {
                ordersdata = null
                data = false
                return res.render('users/Userhomepage', { details, data, categ, ordersdata, banners ,mostSold ,coupons});
            }
        } else {
            return res.redirect('/login')
        }

    } catch (err) {
        console.log(err);
        return res.redirect('/error')
    }
}

function TopSelling(ordersitem) {
    let counts = {};let concatArray = [];
    ordersitem.forEach(item => { concatArray = [...concatArray, ...item.products] })
    concatArray.forEach(item => { counts[item.productid] = (counts[item.productid] || 0) + 1;  });
    return Object.entries(counts).map(([productid, count]) => ({
        productid,
        count
      }));
}


function loginpage(req, res, next) {
    let data = ""
    if (req.session.user) {
        return res.redirect('/')
    } else {
        if (req.session.blockeduser) {
            req.session.blockeduser = false
            return res.render('users/userLogin', { blocked: true, data });
        } else {
            return res.render('users/userLogin', { blocked: false, data });
        }
    }

}

async function loginpost(req, res, next) {
    try {
        const datas = req.body;
        const user = await userandadminModel.findOne({ email: datas.email });
        if (user) {
            const compared = await bcrypt.compare(datas.password, user.password);
            if (compared) {
                if (user.status) {
                    req.session.user = user;
                    let walletdata = await wallet.findOne({ userId: req.session.user._id })
                    if (!walletdata) {
                        const details = {
                            userId: new mongoose.Types.ObjectId(req.session.user._id),
                            Balance: 0,
                            transactions: []
                        }
                        walletdata = await wallet.insertMany([details])
                        
                    } 
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
    try {
        if (req.session.user) {
            res.redirect('/');
        } else {
            res.render('users/userSignup', { data: '' })
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
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

            if (req.session.otp === req.body.otp) {
                resendotp(req, res, next)
                const datas = await userandadminModel.insertMany([details]);
                console.log(datas);
                req.session.user = datas[0];
                
                let walletdata = await wallet.findOne({ userId: req.session.user._id })
                if (!walletdata) {
                    const details = {
                        userId: new mongoose.Types.ObjectId(req.session.user._id),
                        Balance: 0,
                        transactions: []
                    }
                    walletdata = await wallet.insertMany([details])
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
        res.redirect('/error')
    }
}


const sendotp = async (req, res, next) => {
    const data = await userandadminModel.findOne({ email: req.query.email })
    if (data) {
        res.status(400).json({})
    } else {
        req.session.otp = await sendOtp(req.query.email);
        res.status(200).json({ status: true,otp:req.session.otp })
    }
}

const shoppage = async (req, res, next) => {
    if (req.session.user) {
        let search = req.query.search || '';
        let sortOption = req.query.sort || 'featured';

        let sortCriteria;
        switch (sortOption) {
            case '1':
                sortCriteria = { price: 1 };
                break;
            case '-1':
                sortCriteria = { price: -1 };
                break;
            default:
                sortCriteria = {};
        }
        const categoriesToShow = await categories.find({ publish: true });

        let datas = await products.find({ publish: true }).sort(sortCriteria);
        if (search !== '') {
            datas = await products.find({
                $and: [
                    {
                        $or: [
                            { Name: { $regex: search, $options: 'i' } },
                            { category: { $regex: search, $options: 'i' } }
                        ]
                    },
                    { publish: true }
                ]
            });

        }

        datas = req.session.productPagination || datas
        let data = req.session.user;
        let current = req.session.currentPage || 1
        res.render('users/shop', { datas, data, categoriesToShow, current });
    } else {
        res.redirect('/login');
    }

}

const paginationData = async (req, res, next) => {
    try {
        if (req.session.user) {
            let prod = null
            let page = Number(req.query.page)
            if (page) {
                let curr = Number(req.query.current) + page
                prod = (Number(curr) * 10) - 10
                req.session.currentPage = curr
            } else {
                prod = (Number(req.query.value) * 10) - 10
            }
            req.session.productPagination = await products.find({ publish: true }).skip(prod).limit(10)

            res.redirect('/shop')
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }

}

const userprofile = async (req, res, next) => {
    if (req.session.user) {
        const data = req.session.user
        const userdata = await userandadminModel.findOne({ _id: data })
        const address = await Address.findOne({ user: data._id })
        const addressdata = (address != '') ? address : null;

        const orderdata = await Order.find({ userId: userdata._id }).sort({ _id: -1 })

        res.render('users/userprofile', { userdata, addressdata, orderdata, data })
    } else {
        res.redirect('/login')
    }
}


const addUserAddress = async (req, res, next) => {
    try {
        if (req.session.user) {

            const userid = req.session.user._id
            console.log(new mongoose.Types.ObjectId(userid));
            const details = req.body
            console.log(details);
            let newAddress = {
                addressType: details.addressType,
                Firstname: details.Firstname,
                Lastname: details.Lastname,
                Address: details.Address,
                HouseNo: details.HouseNo,
                Street: details.Street,
                City: details.City,
                State: details.State,
                Landmark: details.Landmark,
                district: details.district,
                Country: details.Country,
                Pincode: details.Pincode,
                phone: details.phone,
                email: details.email
            }
            let userData = await Address.findOne({ user: new mongoose.Types.ObjectId(userid) })
            if (userData) {
                let alreadyInside = userData.userAddress.find((address) => {
                    if (address.addressType == newAddress.addressType) {
                        return true
                    } else {
                        return false
                    }
                })
                console.log(alreadyInside);
                if (!alreadyInside) {
                    userData.userAddress.push(newAddress)
                }
                userData.save()
            } else {
                let insertData = {
                    user: userid,
                    userAddress: [
                        newAddress
                    ]
                }
                let resp = await Address.insertMany([insertData])

            }
            res.redirect('/profile')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }

}

const editAddresspro = async (req, res, next) => {
    if (req.session.user) {
        const userdata = req.session.user._id
        const datas = req.body;
        let editeddata = await Address.findOne({ user: userdata })
        editeddata.userAddress[req.body.index] = {
            addressType: datas.addressType,
            Firstname: datas.Firstname,
            Lastname: datas.Lastname,
            Address: datas.Address,
            HouseNo: datas.HouseNo,
            Street: datas.Street,
            district: datas.district,
            City: datas.City,
            State: datas.State,
            Landmark: datas.Landmark,
            Country: datas.Country,
            Pincode: datas.Pincode,
            phone: datas.phone,
            email: datas.email
        }
        console.log(editeddata);
        await editeddata.save()
        res.redirect('/profile')
    }
}

const editcheckoutaddress = async (req, res, next) => {
    if (req.session.user) {
        const userdata = req.session.user._id
        const datas = req.body;
        let editeddata = await Address.findOne({ user: userdata })
        editeddata.userAddress[req.body.index] = {
            addressType: datas.addressType,
            Firstname: datas.Firstname,
            Lastname: datas.Lastname,
            Address: datas.Address,
            HouseNo: datas.HouseNo,
            Street: datas.Street,
            district: datas.district,
            City: datas.City,
            State: datas.State,
            Landmark: datas.Landmark,
            Country: datas.Country,
            Pincode: datas.Pincode,
            phone: datas.phone,
            email: datas.email
        }
        console.log(editeddata);
        await editeddata.save()
        res.redirect('/checkout')
    }
}

const editAddressdata = async (req, res, next) => {
    try {
        if (req.session.user) {
            const userid = req.session.user._id
            console.log(new mongoose.Types.ObjectId(userid));
            const details = req.body

            let newAddress = {
                addressType: details.addressType,
                Firstname: details.Firstname,
                Lastname: details.Lastname,
                Address: details.Address,
                HouseNo: details.HouseNo,
                Street: details.Street,
                City: details.City,
                State: details.State,
                Landmark: details.Landmark,
                district: details.district,
                Country: details.Country,
                Pincode: details.Pincode,
                phone: details.phone,
                email: details.email
            }
            let userData = await Address.findOne({ user: new mongoose.Types.ObjectId(userid) })
            if (userData) {
                let alreadyInside = userData.userAddress.find((address) => {
                    if (address.addressType == newAddress.addressType) {
                        return true
                    } else {
                        return false
                    }
                })

                if (!alreadyInside) {
                    userData.userAddress.push(newAddress)
                }
                userData.save()
            } else {
                let insertData = {
                    user: userid,
                    userAddress: [
                        newAddress
                    ]
                }
                let resp = await Address.insertMany([insertData])

            }
            res.redirect('/checkout')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }

}

const deleteAddressdata = async (req, res, next) => {
    try {
        if (req.session.user) {
            const datas = req.body
            console.log(datas);
            const user = req.session.user._id
            const userdetail = await Address.findOne({ user: user })
            console.log(userdetail, datas.userid);
            userdetail.userAddress.splice(datas.arrindex, 1)
            await userdetail.save()
            res.status(200).json({ status: true })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/login')
    }

}

const editprofile = async (req, res, next) => {
    try {
        if (req.session.user) {
            const datas = req.body;
            console.log(req.session.user);
            const user = req.session.user._id
            console.log(user);
            const changing = await userandadminModel.findByIdAndUpdate(user, {
                $set: {
                    username: datas.Username,
                    phone: datas.phone
                }
            })
            console.log(changing);
            req.session.user = changing
            res.redirect('/profile')
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }

}

const forgotPasswordpage = async (req, res, next) => {
    try {
        if (!req.session.user) {
            res.render('users/forgotPassword', { verified: false, data: '' })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }
}

const emailverification = async (req, res, next) => {
    try {
        const userdata = (req.session.user) ? req.session.user : req.body;
        const result = await userandadminModel.findOne({ email: userdata.email })
        console.log(result);
        if (result) {
            const token = await createToken(userdata.email)
            res.cookie('token', token, { httpOnly: true })
            res.cookie('email', userdata.email, { httpOnly: true })
            return res.status(200).json({ status: true })
        } else {
            return res.status(204).json({ message: "No User Found" })
        }
    } catch (error) {
        console.log(error);
        return res.redirect('/error')
    }
}

const otpverfication = async (req, res, next) => {
    try {
        const urlToken = req.params.token
        console.log(req.cookies.token);
        const tokens = req.cookies.token
        console.log(tokens);
        console.log(urlToken === tokens);
        if (urlToken === tokens) {
            const data = ''
            res.render('users/forgotPassword', { verified: true, data })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }
}

const passwordchange = async (req, res, next) => {
    try {
        if (req.cookies.email && req.cookies.token) {
            const datas = req.body
            const changedfirst = await bcrypt.hash(datas.passwd, 10)
            const changedsecond = await bcrypt.hash(datas.confrm, 10)
            const totalchange = await userandadminModel.findOneAndUpdate({ email: req.cookies.email }, {
                $set: {
                    password: changedfirst,
                    confirmpassword: changedsecond
                }
            })
            req.cookies = null
            if (totalchange && !req.session.user) res.status(200).json({ status: true })
            else if (totalchange && req.session.user) res.status(201).json({ status: true })
            else res.status(400).json({ status: true })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }
}



async function userinvoices(req, res, next) {
    try {
        if (req.session.user) {

            if (req.query.from === '$2b$10$gviVtGpDfqpsAsCkbx8xaukeIQDirbAk2vIJ0IhJROGzYHeHUERp2') {
                let order = await Order.findById(req.query.orderId)

                let Quantity = order.products.quantity

                let product = await Promise.all(order.products.map(async (item, index) => {
                    let proDetails = await products.findById(item.productid)
                    return {
                        "quantity": item.quantity,
                        "price": item.price,
                        "description": proDetails.Name,
                        "tax-rate": 6,

                    }
                }))

                var data = {
                    "customize": {},
                    "logo": "http://localhost:5000/images/Colours%20(1).small.png",
                    "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
                    "sender": {
                        "company": "Colours Pardha Palace",
                        "address": "Chanthappadi Ponnani Malappuram, Kerala",
                        "zip": "679577",
                        "city": "Malappuram",
                        "country": "INDIA"
                    },
                    "client": {
                        "company": order.AddressId.Firstname + "" + order.AddressId.Lastname,
                        "address": order.AddressId.Landmark ,
                        "zip": order.AddressId.HouseNo ,
                        "city": order.AddressId.Street ,
                        "phone": order.AddressId.phone  ,
                        "country": order.AddressId.Country
                    },
                    "information": {
                        "number": order._id + "",
                        "date": order.orderDate,
                        "due-date": "PAID"
                    },
                    "products": product,
                    "bottom-notice": "Thank you for paying in Colours Pardha Palace",
                    "settings": {
                        "currency": "INR",
                    },
                    "translate": {},
                };


                await easyinvoice.createInvoice(data, function (result) {
                    const base64Data = result.pdf;
                    console.log(base64Data);
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', `attachment; filename="INVOICE_${Date.now()}_.pdf`);
                    const binaryData = Buffer.from(base64Data, 'base64');
                    res.send(binaryData);
                });
            } else {
                res.redirect('/ERROR')
            }
        } else {
            res.redirect('/login')
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating the PDF');
    }
}

function contactpage(req, res) {
    try {
        if(req.session.user) {
            const data=req.session.user;
            res.render('users/contact',{data})
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }

}

async function contactpostpage(req,res){
    try {
        if(req.session.user){
            const details= req.body
            let datas={
                userId:new mongoose.Types.ObjectId(req.session.user._id),
                Name:details.name,
                email:details.email,
                phone:details.phone,
                subject:details.subject,
                message:details.message

            }
            console.log(details);
            const inserted= await Contact.insertMany([datas])
            console.log(inserted);
            res.redirect('/contact')
        }else{
            res.redirect('/login')
        } 
    } catch (error) {
        res.redirect('/error')
    }
    
}

async function walletpage(req, res, next) {
    try {
        if (req.session.user) {
            const data = req.session.user
            let walletdata = await wallet.findOne({ userId: data._id })
            if (walletdata) {
                res.render('users/Wallet', { data, walletdata })
            } else {
                const details = {
                    userId: new mongoose.Types.ObjectId(data._id),
                    Balance: 0,
                    transactions: []
                }
                walletdata = await wallet.insertMany([details])
                res.render('users/Wallet', { data, walletdata })
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
        res.redirect('/error')
    }

}


function googlelogin(req, res, next) {
    try {
        req.session.GoogleFrom = req.query.from
        const authUrl = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
            redirect_uri: process.env.googloRedirect,
        });
        res.redirect(authUrl)
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }

}



async function googleLoginsuccess(req, res, next) {
    const { code } = req.query;
    try {
        const tokenResponse = await client.getToken({
            code,
            redirect_uri: process.env.googloRedirect,
        });

        const tokens = tokenResponse.tokens;
        client.setCredentials(tokens);
        req.session.tokens = tokens;
       
        res.redirect('/googleSuccess')
    } catch (error) {
        console.error('Error getting tokens:', error);
        res.redirect('/ERROR');
    }

}

async function googleloginsuccess(req, res, next) {
    if (req.session.tokens) {
        try {
            client.setCredentials(req.session.tokens);
            const userInfo = await google.oauth2('v2').userinfo.get({ auth: client });
            console.log(userInfo.data)
            if (req.session.GoogleFrom === 'LOGIN') {

                let user = await userandadminModel.findOne({ email: userInfo.data.email })

                if (user) {
                    if (await bcrypt.compare(userInfo.data.id, user.password)) {
                        console.log(bcrypt.compare(userInfo.data.id, user.password));
                        req.session.user = user
                        res.redirect("/");
                    } else {
                        req.session.tryLogin = true
                        res.redirect('/login')
                    }
                } else {
                    req.session.pleaseSignup = true
                    res.redirect('/login')
                }

            } else if (req.session.GoogleFrom === 'SIGNUP') {
                let data = {
                    username: userInfo.data.name,
                    email: userInfo.data.email,
                    phone: 1234567890,
                    password: await bcrypt.hash(userInfo.data.id, 10),
                    confirmpassword: await bcrypt.hash(userInfo.data.id, 10),
                    status: true,
                    admin: false,
                    Image: userInfo.data.picture,
                }
                const user = await userandadminModel.insertMany(data)
                console.log(user)
                req.session.user = user[0]
                res.redirect("/");
            }

        } catch (error) {
            console.log('error log', error);
            res.redirect('/ERROR');
        }
    } else {
        res.redirect('/ERROR');
    }
}

const changeUserimage = async (req, res) => {
    try {
        if (req.session.user) {
            res.redirect('/profile')
        }
    } catch (error) {
        console.log(error);
        res.redirect('/error')
    }
}

function destroyToken(req, res, next) {
    setTimeout(() => {
        req.session.token = null
    }, 3 * 60 * 1000)
}


const logout = ((req, res, next) => {
    req.session.destroy()
    res.redirect('/login');
})

function resendotp(req, res, next) {
    setTimeout(() => {
        req.session.otp = null
    }, 1000 * 180)
}


module.exports = {
    homepage, loginpage, signuppage, loginpost, signuppost, sendotp, shoppage, logout, resendotp
    , userprofile, addUserAddress, editAddressdata, editAddresspro, deleteAddressdata, editprofile,
    emailverification, forgotPasswordpage, otpverfication, passwordchange, userinvoices, contactpage,
    walletpage, paginationData, googlelogin, googleLoginsuccess, editcheckoutaddress, googleloginsuccess,
    changeUserimage ,contactpostpage

}