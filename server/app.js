const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

// import helpers
const {
    ERR_404
} = require('./helpers/constants/statusCodeHTTP');

// import controllers
const globalErrHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const ResError = require('./utils/resError');

function initServer(db) {
    const app = new express();
    // write code middleware do something in HERE...

    app.locals.db = db;

    // for parsing application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true }));

    // for parsing application/json
    app.use(bodyParser.json());

    // for parsing multipart/form-data
    // app.use(multer());

    app.use(express.static('public'));

    const optionsCors = {
        origin: function (origin, callback) {
            // console.log(origin)
            const listNotAllow = ['http://localhost:3000'];

            if (listNotAllow.indexOf(origin) !== -1 || !origin) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        }
    }
    // app.use(cors(optionsCors));
    app.use(cors());

    // import routes
    app.use('/api/v1/category', require('./routes/categoryRoute'));
    app.use('/api/v1/product', require('./routes/productRoute'));
    app.use('/api/v1/invoice', require('./routes/invoiceRoute'));
    app.use('/api/v1/purchase', require('./routes/purchaseRoute'));
    app.use('/api/v1/payment', require('./routes/paymentRoute'));

    app.use('/api/v1/user', require('./routes/userRoute'));
    app.use('/api/v1/supplier', require('./routes/supplierRoute'));
    app.use('/api/v1/salesman', require('./routes/salesmanRoute'));
    app.use('/api/v1/customer', require('./routes/customerRoute'));


    app.get('/scan', function (req, res) {
        // console.log(__dirname)
        res.sendFile(__dirname + '/test/file_input.html');
    });

    app.get('/live-scan', function (req, res) {
        // console.log(__dirname)
        res.sendFile(__dirname + '/test/live.html');
    });

    app.use('*', (req, res, next) => {
        const err = new ResError(ERR_404.code, `Page ${ERR_404.message}`);
        next(err, req, res, next);
    });


    // fun handle error
    app.use(globalErrHandler);
    return app;
}

module.exports = initServer