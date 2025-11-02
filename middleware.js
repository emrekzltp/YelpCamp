const { campgroundSchema, reviewSchema} = require('./schemas.js');
const ExpressError= require('./utils/ExpressError.js');
const Campground= require('./models/campground');
const Review= require('./models/review.js');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) { //logged in değilse erişemesin ve bunu sadece passportun sağladığı isAuthenticate() ile kontrol edebiliyoruz!
        req.session.returnTo = req.originalUrl; //sessiona returnTo propertysi eklenir.
        req.flash('error', 'you must be signed in first!');
        return res.redirect('/login'); //else kullanmadığımız için bunu returnlemezsen res.render() yine de çalşır ve 2 tane response gönderemeyeceğinden dolayı hata alırsın.
    }
    next();
}

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

module.exports.validateCampground = (req, res, next) => { //middleware fonk olduğu için parametreler böyle
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.equals(req.user._id)) { 
        req.flash('error', 'You do not have permission to do that');
         return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.equals(req.user._id)) { 
        req.flash('error', 'You do not have permission to do that');
         return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateReview = (req, res, next) => { //review için middleware
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }

}

