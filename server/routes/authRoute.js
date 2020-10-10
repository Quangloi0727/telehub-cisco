var express = require("express");
var router = express.Router();

const ResError = require("../utils/resError");

const { ERR_404, ERR_401 } = require("../helpers/constants");

const { checkAuthenticated } = require("../helpers/functions");

module.exports = function (passport) {
    
    // router.get("/token", checkAuthenticated);

    // /* Handle Login POST */
    // router.post("/token", passport.authenticate("login"), (req, res, next) => {
    //     const { passport, id } = req.session;
    //     res.send({ sid: id, ...passport });
    // });

    // router.post("/logout", (req, res, next) => {
    //     // req.logout();
    //     req.session.destroy((err) => {
    //         res.send();
    //     })
    // });

    return router;
};
