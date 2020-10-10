// Express automatically knows that this entire function is an error handling middleware by specifying 4 parameters
const {
    ERR_500
} = require('../helpers/constants/statusCodeHTTP');

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || ERR_500.code;
    err.status = err.status || 'error';
    // console.log(err.stack);
    res.status(err.statusCode).json({
        statusCode: err.statusCode,
        message: err.message,
    });
};