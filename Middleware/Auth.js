const userAuth = (req, res, next) => {
    if (req.path != '/checkout') {
        req.session.coupon = null
        req.session.discount = null
        req.session.totalPrice = null
    }
    if (req.path === '/') {
        next()
    } else if (req.session.user) {
        next()
    } else {
        res.redirect('/login')
    }
}

module.exports = { userAuth }