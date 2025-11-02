const User = require('../models/user')


module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res, next) => {
    try { //neden ayrı bir try catch kullandık? çünkü hata alınca başka bir sayfaya yönlendirilmek istemedik catchasyncin yaptığı gibi?
        const { email, username, password } = req.body;
        const user = new User({ email, username }); //password hashlenmeden usera kaydedilemez!
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => { //register olan userı anında logged in yapmaya yarar.
            if (err) return next(err);
            req.flash('success', 'Welcome to YelpCamp');
            res.redirect('/campgrounds');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
}

module.exports.login = (req, res) => { //bu kısım tüm doğrulama işini yapar!
    req.flash('success', 'welcome back!'); //buraya geliyorsa zaten authenticate kısmı sağlanmıştır.
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) return next(err);

    // Flash mesajını session silinmeden önce kaydet
    req.flash('success', 'Goodbye!');

    // Şimdi session'ı temizle
    req.session.destroy(function(err2) {
      if (err2) return next(err2);

      res.clearCookie('connect.sid', { path: '/' });
      return res.redirect('/campgrounds');
    });
  });
};
