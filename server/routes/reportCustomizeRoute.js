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

router
    .route('/report-ivr-month-2-date')
    .get(_controller.reportIVRMonth2Date);

router
    .route('/report-statistic')
    .post(_controller.reportStatistic);
router
    .route('/agent-status-by-time')
    .get(_controller.reportAgentStatusByTime);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/