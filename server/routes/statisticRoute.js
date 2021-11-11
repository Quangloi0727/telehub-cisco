const express = require('express');
let router = express.Router();
let _controller = require('../controllers/statisticController');

/**
 * Báo cáo tổng hợp theo đầu số, theo miền của kplus
 */
router
    .route('/by-digits-dialed')
    .post(_controller.byDigitDialedByDay);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/