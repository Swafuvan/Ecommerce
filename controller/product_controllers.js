const userandadminModel = require('../model/database-model');
const products = require('../model/productModel');
const categories = require('../model/categoryModel');
const { default: mongoose } = require('mongoose');



async function adminproduct(req, res, next) {
    try {
        if (req.session.admin) {
            let items = await products.find().limit(6)
            const datas = await categories.find()
            items = req.session.productPagin || items
            let current = req.session.currentPag || 1
            res.render('admin/adminProduct', { items, datas, current });
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

async function productupdate(req, res, next) {
    try {
        req.body.publish = Boolean(req.body.publish);
        let offerPrice = req.body.price
        if (req.body.offerType === 'percentage') {
            offerPrice = req.body.price - ((req.body.price * req.body.offer) / 100)
        } else if (req.body.offerType === 'price') {
            offerPrice = req.body.price - req.body.offer
        }
        const updatedProduct = await products.findByIdAndUpdate(req.body.productId, {
            $set: {
                Name: req.body.Name,
                size: req.body.size,
                description: req.body.description,
                category: req.body.category,
                Offer: {
                    offerType: req.body.offerType,
                    offer: req.body.offer,
                },
                basePrice: req.body.price,
                publish: req.body.publish,
                price: offerPrice,
                Quantity: req.body.Quantity,
                Color: req.body.Color,
                For: req.body.For,
            }
        }, { new: true });
        console.log(updatedProduct);
        req.session.productname = null
        return res.redirect('/admin/product')
    } catch (err) {
        console.log(err);
    }

}

const editproductpage = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const productId = req.query.productid;
            const product = await products.findById(productId)

            const datas = await categories.find()
            res.render('admin/editproduct', { product, datas })
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

async function adminaddproduct(req, res, next) {
    try {
        if (req.session.admin) {
            const details = await products.find();
            const category = await categories.find()
            res.render('admin/addproduct', { details, category });
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }


}

const productsview = async (req, res, next) => {
    try {
        if (req.session.user) {
            console.log(req.query.id);
            const datas = await products.findById(req.query.id)
            console.log(datas);
            const details = await products.find()
            const data = req.session.user
            console.log(data);

            res.render('users/productview', { datas, details, data })
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        error
    }

}

async function adminaddpost(req, res, next) {
    try {
        if (req.session.admin) {
            if (req.body !== "") {
                console.log(req.session.productImage);
                req.body.publish = Boolean(req.body.publish);
                let image = []
                req.session.productImage.forEach((images, index) => {
                    if (index >= 1) {
                        image.push(images)
                    }
                })
                let offerPrice = req.body.basePrice
                if (req.body.offerType === 'percentage') {
                    offerPrice = req.body.price - ((req.body.price * req.body.offer) / 100)
                } else if (req.body.offerType === 'price') {
                    offerPrice = req.body.price - req.body.offer
                }
                let product = {
                    Name: req.body.Name,
                    size: req.body.size,
                    description: req.body.description,
                    category: req.body.category,
                    coverImages: req.session.productImage[0],
                    images: image,
                    Offer: {
                        offerType: req.body.offerType,
                        offer: req.body.offer,
                    },
                    publish: req.body.publish,
                    basePrice: req.body.price,
                    price: offerPrice,
                    Quantity: req.body.Quantity,
                    Color: req.body.Color,
                    For: req.body.For,
                }
                const datas = await products.insertMany([product])
                req.session.productImage = null
                console.log(datas);
            }
            res.redirect('/admin/product');
        } else {
            res.redirect('/admin/login')
        }

    } catch (error) {
        console.log(error);
    }

}

async function categorymanagement(req, res, next) {
    try {
        if (req.session.admin) {
            const product = await products.find()
            const category = await categories.find()

            // if (req.session.category) {
            //     res.render('admin/category', { category, product, categorydata: req.session.categoriesdata });
            // } else {

            // }
            let categoriesdata = (category.length != 0) ? category : {};
            res.render('admin/category', { category, product, categoriesdata });
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        error
    }

}

const categoryedit = async (req, res, next) => {
    try {
        if (req.session.admin) {
            let detial = req.query.id;
            console.log(detial);
            const datas = await categories.findById(detial)
            console.log(datas);
            res.status(200).json(datas)
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

const categoryeditpost = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const catdata = req.body
            console.log(catdata);
            const categorydatass = await categories.findByIdAndUpdate(catdata.id, {
                $set: {
                    Name: catdata.Name,
                    category: catdata.category,
                    description: catdata.description,
                    publish: catdata.publish
                }
            }, { new: true })
            console.log(categorydatass);
            res.redirect('/admin/category')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

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
    try {
        console.log(req.body);
        let publish = (req.body.publish === "true") ? false : true;
        let data = await products.findByIdAndUpdate(req.body.items, {
            $set: {
                publish: publish
            }
        }, { new: true })
        console.log(data);
        res.status(200).json({ status: true })
    } catch (error) {
        console.log(error);
    }

}

const categorypublish = async (req, res, next) => {
    try {
        if (req.session.admin) {
            const categ = req.body;
            const datas = await categories.findOne(new mongoose.Types.ObjectId(categ.dataid))
            if (datas) {
                let publish = (categ.data === "true") ? false : true;
                const dataa = await categories.findByIdAndUpdate(categ.dataid, {
                    $set: {
                        publish: publish
                    }
                })
                console.log(dataa);
            }
            res.status(200).json({ status: true })
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }

}

async function adminPaginationpdt(req,res,next){
    try {
        if (req.session.admin) {
            let prod = null
            let page = Number(req.query.page)
            if (page) {
                let curr = Number(req.query.current) + page
                prod = (Number(curr) * 6) - 6
                req.session.currentPag =  curr
            } else {
                prod = (Number(req.query.value) * 6) - 6
            }
            req.session.productPagin = await products.find().skip(prod).limit(6)

            res.redirect('/admin/product')
        } else {
            res.redirect('/admin/login')
        }
    } catch (error) {
        console.log(error);
    }
}

const deleteimages = async (req, res, next) => {
    const datas = req.body
    const prod = await products.findById(datas.productid)
    const updatedImages = prod.images.filter(image => image !== datas.img);
    prod.images = updatedImages;

    await prod.save();

    return res.status(200).json({ success: true });
}

module.exports = {
    adminproduct, adminaddproduct, categorymanagement, adminaddpost, categorypost, publishproduct, categorypublish
    , productupdate, categoryedit, productsview, categoryeditpost, editproductpage, deleteimages ,adminPaginationpdt
} 