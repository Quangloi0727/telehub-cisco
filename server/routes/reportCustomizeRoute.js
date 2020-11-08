const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportCustomizeController');

router
    .route('/report-20-80')
    .get(_controller.report2080);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/