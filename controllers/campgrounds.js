const Campground = require('../models/campground');
const { cloudinary } = require('../cloudinary');

const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds })
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createCampground = async (req, res, next) => { //birden fazla middleware ekleyebiliyoruz!!!!
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 }); //maptilera forward geocoding API çağrısı yapıyor ve gelen yanıt sayısını 1 ile limitliyor.
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.features[0].geometry; //latitude ve longitude verileri alınır.
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename })) //her bir elemandan 2 özellik alınarak yeni bir obje oluşturulup images arrayine atılır.
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
    req.flash('success', 'Successfully made a new campground!'); //flashı kapatınca yazı gitmiyor çözülmeli. 
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.showCampground = async (req, res) => {
    const campground = await Campground.findById(req.params.id).
        populate({ //nested populate: campin reviewları ve her bir reviewın author'ı populate edilir
            path: 'reviews',
            populate: {
                path: 'author'
            }
        }).populate('author');
    if (!campground) { // bu kontrolü yapmazsak biri daha önceden var olan bir kamp nesnesine gitmek istenirse show.ejse boş bir nesne gönderir ve bu yüzden hata alırız bu yüzden uygun uyarıyı verip yeniden yönlendirmeliyiz.
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) { // bu kontrolü yapmazsak biri daha önceden var olan bir kamp nesnesine gitmek istenirse show.ejse boş bir nesne gönderir ve bu yüzden hata alırız bu yüzden uygun uyarıyı verip yeniden yönlendirmeliyiz.
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }, { new: true }); // güncellenmiş veriyi döndürsün */
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    campground.geometry = geoData.features[0].geometry;
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename })); //her bir elemandan 2 özellik alınarak yeni bir obje oluşturulup images arrayine atılır.
    campground.images.push(...imgs) //tüm arrayi atamayız spreadlemeliyiz çünkü mongo bizden string bekliyor! string arrayi değil! 
    await campground.save()
    if (req.body.deleteImages) { //bu arrayde bir şey varsa kampa ait bazı veya tüm resimler silinecek demektir.
        for (let filename of req.body.deleteImages) { //destroy cloudinaryye ait bir fonksiyondur ve clouddan da silmemizi sağlar.
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }

    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground');
    res.redirect('/campgrounds');
}