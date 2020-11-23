const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportCustomizeController');

router
    .route('/report-20-80')
    .get(_controller.report2080);

router
    .route('/report-IncomingCallTrends')
    .get(_controller.reportIncomingCallTrends);

router
    .route('/report-ACD-summary')
    .get(_controller.reportACDSummary);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/