if (process.env.NODE_ENV !== "production") { //env dosyasını kullanmak için.
    require('dotenv').config();
}

const mongoose = require('mongoose');
const Campground = require('../models/campground'); //farklı klasörde olduğu için .. kullandık.
const cities = require('./cities');
const { places, descriptors } = require(`./seedHelpers`); //exportlanan iki array de alınır.
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';


mongoose.connect(dbUrl)
    .then(() => {
        console.log("Database Connected!");
    })
    .catch(err => {
        console.log('Connection Error:');
        console.log(err);
    });

const db = mongoose.connection; //aynı referans vermeyi kısaltma muhabbeti 

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('database connected');
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];  //arrayin herhangi bir elemanını returnler

const seedDb = async () => { //promise dönderir 
    await Campground.deleteMany({}); //her şeyi siler
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '68d42faad415bfc854314e5c',
            location: `${cities[random1000].city},${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)} `,
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Molestias rem sequi, consequatur error provident iusto illo veniam ipsa soluta perspiciatis repudiandae, labore pariatur distinctio? Exercitationem animi autem sunt laborum. Tempore?',
            price, //price: price ile aynı şeydir!!!
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]

            },
            images: [
                {
                    url: 'https://res.cloudinary.com/duetzp81x/image/upload/v1758451325/YelpCamp/svguowoiq5dxqpdv3xon.jpg',
                    filename: 'YelpCamp/svguowoiq5dxqpdv3xon',
                },
                {
                    url: 'https://res.cloudinary.com/duetzp81x/image/upload/v1758654427/YelpCamp/npfkcihjphc4zwx47zxh.jpg',
                    filename: 'YelpCamp/npfkcihjphc4zwx47zxh'
                }
            ]

        })
        await camp.save();
    }
}

seedDb().then(() => {
    mongoose.connection.close(); //işimiz bittikten sonra bağlantıyı kapatıyoruz.
})

