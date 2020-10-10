const ResError = require("../../utils/resError");
const crypto = require("crypto");
var jwt = require('jsonwebtoken');

// gen pass: 1
// console.log(crypto.createHmac('sha256', '68ac68').update('1').digest('hex'));

// import helpers
const { ERR_404, ERR_401 } = require("../constants/index.js");
const { formatDate } = require("./dateTime");

exports.checkAuthenticated = function(req, res, next) {

    // check header or url parameters or post parameters for token
    var token = (req.body && req.body.token ? req.body.token : null) || (req.query && req.query.token ? req.query.token : null) || req.headers['x-access-token'];
    // decode token
    if (token) {

        // verifies secret and checks exp
        jwt.verify(token, _config.cisco.auth.secret, function(err, decoded) {
            if (err) {
                // log.info(MSG_LOG.AUTH_API.FAIL);
                const err = new ResError(ERR_401.code, 'Failed to authenticate token.');
                return next(err);
            } else {
                // if everything is good, save to request for use in other routes
                // log.info(MSG_LOG.AUTH_API.SUCCESS);

                req.decoded = decoded;
                next();
            }
        });
    } else {

        // if there is no token
        // return an error
        _logger.log("info" , "No token provided.");
        const err = new ResError(ERR_401.code, 'No token provided.');
        return next(err);
    }
};
// (r, res, next) => {
//     const { sessionID } = req;
//     // console.log(JSON.stringify({ sessionID, time: formatDate(Date.now()) }));
//     _logger.log('info', `${req.baseUrl}, body: ${JSON.stringify(req.body)}`);
//     if (req.isAuthenticated()) return next();
//     const err = new ResError(ERR_401.code, `${ERR_401.message}`);
//     return next(err);
// };eq

/**
 * Mã hóa mật khẩu dùng thuật toán SHA-256
 * @param {String} password
 * @param {String} salt
 */
exports.hashPassword = (password, salt) => {
    return crypto.createHmac("sha256", salt).update(password).digest("hex");
};

/**
 * Tạo salt ngẫu nhiên
 * @param {Integer} len
 */
exports.randomSalt = (len = 6) => {
    let text = ``;
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < len; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};
