const express = require('express');
const catchAsync = require('../utils/catchAsync');
const router = express.Router();
const { isLoggedIn, isAuthor, validateCampground } = require('../middleware.js');
const campgrounds = require('../controllers/campgrounds.js');
const multer = require('multer');
const { storage } = require('../cloudinary/index.js') //node index.js e baktığı için direkt index.js yazmaya gerek yok!
const upload = multer({ storage }); //dosyaları oluşturduğumuz cloudinary storageda saklamak için 

router.route('/')
    .get(catchAsync((campgrounds.index)))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))


router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground))



router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm));



module.exports = router;