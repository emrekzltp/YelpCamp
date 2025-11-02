if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
app.locals.maptilerApiKey = process.env.MAPTILER_API_KEY;
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const sanitizeV5 = require('./utils/mongoSanitizeV5.js');
const app = express();
app.set('query parser', 'extended');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local')
const User = require('./models/user.js');
const helmet = require('helmet');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

const store = MongoStore.create({ //session nesneleri sessions diye bir collectionsda saklanıyor.
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisshouldbeabettersecret!'
    }
});

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", // add this
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", // add this
];
const connectSrcUrls = [
    "https://api.maptiler.com/", // add this
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "https://api.maptiler.com/",
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/duetzp81x/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

const campgroundRoutes = require('./routes/campgrounds.js');
const reviewRoutes = require('./routes/reviews.js');
const userRoutes = require('./routes/users.js');

const sessionConfig = {
    store,
    name: 'session', //session id default ismi değiştirilir.
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true, //cookielerin js değil http üzerinden erişilebilirdir.
        /* secure:true, //https üzerinden çalışması sağlanır. localhost https değildir! */
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(sanitizeV5({ replaceWith: '_' }));  //yasaklı karakterleri önlemek için. 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
//passport.sessiondan önce gelmeli 
app.use(session(sessionConfig));
app.use(flash());

app.use(helmet({ contentSecurityPolicy: false }));//11 tane middleware var.
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())); //passport nesnesine local passport nesnesi verek local login kullanacağımızı söylüyoruz ve authenticate fonksiyonu olarak da p-l-mongoose ile gelen authenticate fonksiyonunu kullancağımızı söylüyoruz

passport.serializeUser(User.serializeUser()); //passporta nasıl serialliize yapacağını söyler. 
passport.deserializeUser(User.deserializeUser()); // aynısnın deserialize nasıl yapılacağı hali.


mongoose.connect(dbUrl)
    .then(() => {
        console.log("Database Connected!");
    })
    .catch(err => {
        console.log("Connection Error:");
        console.log(err);
    });


const db = mongoose.connection; //aynı referans vermeyi kısaltma muhabbeti 

db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("database connected");
})


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.engine('ejs', ejsMate);


app.use((req, res, next) => {
    console.log(req.query);
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user; //session sayesinde şu anki userı alabiliriz.
    next();
})

app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'colt@gmail.com', username: 'colt' });
    const newUser = await User.register(user, 'chicken');
    res.send(newUser);
})

app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);
app.use('/', userRoutes);

app.get('/', (req, res) => {
    res.render('home');
})


app.all(/(.*)/, (req, res, next) => { //var olmayan her türlü route isteği buraya düşer!
    next(new ExpressError('Page not found', 404)); //message ve statusCode 
})

app.use((err, req, res, next) => { //next(e) buraya düşer şu anlık main handlerımız bu 
    const { statusCode = 500 } = err; //hata yapma classından gelen bir hataysa zaten bu 2 property vardır ama generic yapılan bir hataysa o zaman default değerleri kullanırız. mongoosedan falan gelensse şu an zeten onun kendi messagı var  ama ve status var ve değeri 500!
    if (!err.message) err.message = 'Oh No, Something went wrong';
    res.status(statusCode).render('error', { err });
})

app.listen(3000, () => {
    console.log("Serving on port 3000");
})