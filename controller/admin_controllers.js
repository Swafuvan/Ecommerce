const { userandadminModel } = require('../model/database-model');
const database = userandadminModel;
const bcrypt = require('bcrypt');

function adminhome(req, res, next) {
    if (req.session.admin) {
        res.render('admin/adminHome')
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
        let datas = await database.find({ admin: admin = false }).sort({ username: 1 });
        if (datas) {
            
            res.render('admin/User-Management', { datas })
        } else {
            res.redirect('/admin')
        }
    } else {
        res.redirect('/admin/login');
    }
}

async function blockuser(req, res, next) {
    let userData = await database.findById(req.body.userid);
    if (userData.status === true) {
        userData.status = false;
        await userData.save()
        res.status(200).json({ status: true })
    } else {
        userData.status = true
        await userData.save()
        res.status(201).json({ status: true })
    }
}

async function orderdetails(req, res, next) {
    if (req.session.admin) {
        res.render('admin/order')
    } else {
        res.redirect('/admin/login');
    }
}

function adminlogout(req, res, next) {
    req.session.destroy()
    res.redirect('/admin/login');
}


module.exports = { adminhome, adminlogin, adminlogpost, adminlogout, usermanagement, blockuser, orderdetails }