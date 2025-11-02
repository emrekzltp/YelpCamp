const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({ //cloudinary nesnesi ile cloudinary hesabımız bağlanır
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET

});

const storage = new CloudinaryStorage({ //storage nesnesi cloudinary ile bağdaştırılır
    cloudinary,
    params: {
        folder:'YelpCamp',
        allowedFormats: ['jpeg', 'png', 'jpg']
    }
});

module.exports = { //oluşturulan nesneler export edilir.
    cloudinary,
    storage
}