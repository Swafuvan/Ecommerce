const userandadminModel = require('../model/database-model');
const Order = require('../model/orderModel');
const products = require('../model/productModel');
const Address = require('../model/addressModel');

const bcrypt = require('bcrypt');
const { sendOtp, createToken } = require('../model/OTP');
const { default: mongoose } = require('mongoose');
const { ObjectId } = require('mongodb');
const categories = require('../model/categoryModel');
const wallet = require('../model/walletModel');
const easyinvoice = require('easyinvoice');



async function homepage(req, res, next) {
    try {
        if (req.session) {
            const details = await products.find({ publish: true })
            const categ = await categories.find()
            if (req.session.user) {
                let data = await userandadminModel.findById(req.session.user)
                res.render('users/Userhomepage', { details, data, categ });
            } else {
                data = false
                res.render('users/Userhomepage', { details, data, categ });
            }
        } else {
            res.redirect('/login')
        }

    } catch (err) {
        console.log(err);
    }
}


function loginpage(req, res, next) {
    let data = ""
    if (req.session.user) {
        res.redirect('/')
    } else {
        if (req.session.blockeduser) {
            req.session.blockeduser = false
            res.render('users/userLogin', { blocked: true, data });
        } else {
            res.render('users/userLogin', { blocked: false, data });
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
        res.render('users/userSignup', { data: '' })
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
            const datas = await userandadminModel.insertMany([details]);
            console.log(datas);
            if (datas) {

                if (req.session.otp === req.body.otp) {
                    req.session.user = datas[0];
                    resendotp(req, res, next)
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
    const data = await userandadminModel.findOne({ email: req.query.email })
    if (data) {
        res.status(400).json({})
    } else {
        req.session.otp = await sendOtp(req.query.email);
        res.status(200).json({ status: true })
    }
}

const shoppage = async (req, res, next) => {
    if (req.session.user) {
        let search = req.query.search || '';
        let sortOption = req.query.sort || 'featured';
        // searchData= new RegExp('/^')

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
        const categoriesToShow = await categories.find({ publish: true });
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

const editAddressdata = async (req, res, next) => {
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
            res.status(200).json({ status: true })
        } else {
            res.status(204).json({ message: "No User Found" })
        }
    } catch (error) {
        console.log(error);
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
                        "company": order.AddressId.Firstname +""+ order.AddressId.Lastname,
                        "address": order.AddressId.Address || 'nale',
                        "zip": order.AddressId.pincode || 'nale',
                        "city": order.AddressId.city || 'nale',
                        "phone": order.AddressId.phone+"",
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

                //start 
                // const data = {
                //     "documentTitle": "INVOICE",
                //     "currency": "INR",
                //     "taxNotation": "gst",
                //     "marginTop": 25,
                //     "marginRight": 25,
                //     "marginLeft": 25,
                //     "marginBottom": 25,
                //     "logo": "https://public.easyinvoice.cloud/img/watermark-draft.jpg",  
                //     "background": "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
                //     "sender": {
                //         "company": "Colours Pardha Palace",
                //         "address": "Chanthappadi Ponnani Malappuram,Kerala",
                //         "zip": "679577",
                //         "city": "Malappuram",
                //         "country": "INDIA"
                //     },
                //     "client": {
                //         "company": order.AddressId.Firstname + order.AddressId.Lastname,
                //         "address": order.AddressId.Address || 'nale',
                //         "zip": order.AddressId.pincode || 'nale',
                //         "city": order.AddressId.city || 'nale',
                //         "phone": order.AddressId.phone ,
                //         "country": order.AddressId.Country
                //     },
                //     "invoiceNumber": "123",
                //     "invoiceDate": "2023-01-01",
                //     "products": product,
                //     "bottomNotice": "Thank you for your business."
                // };

                //end
                console.log(data);
                await easyinvoice.createInvoice(data, function (result) {
                    console.log(result);
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

function contactpage(req, res, next) {
    try {
        if (req.session.user) {
            res.render('users/contact')
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }

}

async function walletpage(req, res, next) {
    try {
        if (req.session.user) {
            const data = req.session.user
            let walletdata = await wallet.findOne({ userId: data._id })
            console.log("asdsd" + walletdata);
            if (walletdata) {
                console.log('sdxrcfgvbhjnkdfcgvbhvanninn1');
                res.render('users/Wallet', { data, walletdata })
            } else {
                console.log('ethi');
                const details = {

                    userId: new mongoose.Types.ObjectId(data._id),
                    Balance: 0,
                    transactions: []
                }
                walletdata = await wallet.insertMany([details])
                console.log(walletdata);
                res.render('users/Wallet', { data, walletdata })
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
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
    walletpage, paginationData,

}