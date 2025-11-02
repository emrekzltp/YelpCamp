const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema; //uzun uzun refere etmek yerine artık Schema'yı kullanabiliriz


const ImageSchema = new Schema({ //imagea fonksiyon ekleyebilmek için ayrıca onun için bir schema oluşturduk. Modeline ihtiyacımız yok ve aynı mantıkla Campground'a ait olarak hayatına devam ediyor.
  url: String,
  filename: String

});

const opts= {toJSON: {virtuals: true}}; //default olarak monoose jsona çevrilen virtuallarıi include etmediği için böyle bir şey yaptık.

ImageSchema.virtual('thumbnail').get(function () { //databasede ayrıca saklamaya gerek olmadığı için virtual kullanıyoruz!
  return this.url.replace('/upload', '/upload/w_200'); //cloudinarynin trnasform api'ına çağrı yapmak için.
})

const CampgroundSchema = new Schema({ //bu şemaya göre class oluşturulur.
  title: String,
  images: [ImageSchema],
  geometry: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ]
}, opts);


CampgroundSchema.virtual('properties.popUpMarkup').get(function () {  // bu kısım maptilerın beklediği veri formatını sanal property ile sağlamakla alakalı. properties: in altına popUpMarkup:  sağlanıyor
  return  `<strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
  <p>${this.description.substring(0.20)}...</p>`
})


CampgroundSchema.post("findOneAndDelete", async function (doc) { //silinen campground döner doc ile alırız
  if (doc) { //var olmayan bir şeyi silmenin anlamı yok
    await Review.deleteMany({ //idsi doc.reviewsda olan reviewları siler
      _id: {
        $in: doc.reviews
      }
    })
  }
})

module.exports = mongoose.model('Campground', CampgroundSchema); //başka dosyalarda require dosya adı yapıldıktan sonra new Campground vs şeklinde kullanılabilir
