const { products, categories } = require('../model/database-model');


async function adminproduct(req, res, next) {
    if (req.session.admin) {
        const items = await products.find()
        res.render('admin/adminProduct', { items });
    } else {
        res.redirect('/admin/login')
    }
}

async function productupdate(req, res, next) {
    try {
        req.body.publish = Boolean(req.body.publish);
        req.body.images = req.files
        let array =  req.files.images
        let imagesarray = req.session.productname.filter((item, index) => index !== 0);
        const updatedProduct = await products.findByIdAndUpdate(req.body.productId, {
            $set: {
                Name: req.body.Name,
                size: req.body.size,
                description: req.body.description,
                category: req.body.category,
                coverImages:coverimage[0].filename,
                images:imagesarray,
                publish: req.body.publish,
                price: req.body.price,
                Quantity: req.body.Quantity,
                Color: req.body.Color,
                For: req.body.For,
            }
        }, { new: true });
        req.session.productname = null

        return res.redirect('/admin/product')
    } catch (err) {
        console.log(err);
    }


}



async function adminaddproduct(req, res, next) {
    if (req.session.admin) {
        const details = await products.find();
        const category = await categories.find()
        res.render('admin/addproduct', { details, category });
    } else {
        res.redirect('/admin/login')
    }

}

async function adminaddpost(req, res, next) {
    if (req.body !== "") {
        req.body.publish = Boolean(req.body.publish);
        let product = {
            Name: req.body.Name,
            size: req.body.size,
            description: req.body.description,
            category: req.body.category,
            coverImages: req.session.productname[0],
            images:  [
                req.session.productname[1],
                req.session.productname[2],
                req.session.productname[3]
            ],

            publish: req.body.publish,
            price: req.body.price,
            Quantity: req.body.Quantity,
            Color: req.body.Color,
            For: req.body.For,
        }
        const datas = await products.insertMany([product])
        req.session.productname = null
        console.log(datas);
    }
    res.redirect('/admin/product');
}

async function categorymanagement(req, res, next) {
    if (req.session.admin) {
        const product = await products.find()
        const category = await categories.find()
        if (req.session.category) {
            console.log(req.session.categorydata);
            res.render('admin/category', { category, product, categorydata: req.session.categoriesdata });
        } else {
            let categoriesdata = {}
            res.render('admin/category', { category, product, categoriesdata });
        }
    } else {
        res.redirect('/admin/login')
    }
}

const categoryedit = async (req, res, next) => {
    let detial = req.body
    const datas = await categories.findById(detial);
    console.log(datas);
    req.session.category = true
    req.session.categoriesdata = datas
    res.redirect('/admin/category')
}

const categorypost = async (req, res, next) => {
    try {
        if (req.body.Name && req.body.category) {
            const details = await categories.insertMany(req.body);
            console.log(details);
            res.redirect('/admin/category')
        }
    } catch (error) {
        console.log(error);
    }
}

const publishproduct = async (req, res, next) => {
    console.log(req.body);
    let publish = (req.body.publish === "true") ? false : true;
    let data = await products.findByIdAndUpdate(req.body.items, {
        $set: {
            publish: publish
        }
    }, { new: true })
    console.log(data);
    res.redirect('/admin/product');
}

const categorypublish = async (req, res, next) => {
    const datas = await products.find(dataid)
    if (datas) {
        let publish = (req.body.publish === "true") ? false : true;
        let data = await products.findByIdAndUpdate(req.body.items, {
            $set: {
                publish: publish
            }
        }, { new: true })
    }
    res.redirect('/admin/category')
}


module.exports = {
    adminproduct, adminaddproduct, categorymanagement, adminaddpost, categorypost, publishproduct, categorypublish
    , productupdate, categoryedit,
} 