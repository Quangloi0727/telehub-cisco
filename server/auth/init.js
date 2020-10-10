let login = require("./login");
let logout = require("./logout");

// let signup = require('./signup');
// let User = require('../models/user');

module.exports = (passport) => {
    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
    passport.serializeUser(function (user, done) {
        // console.log("serializing user: ");
        // console.log(user);
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        // User.findById(id, function(err, user) {
        // let user = {_id: 'a8d7sa87dsa', name: 'demo'};
        // console.log('deserializing user:', user);
        done(null, user);
        // });
    });

    // Setting up Passport Strategies for Login and SignUp/Registration
    login(passport);
    // logout(passport);
    // signup(passport);
};
