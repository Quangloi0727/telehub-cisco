const express = require('express');
let router = express.Router();
let _controller = require('../controllers/procedureController');

router
    .route('/report-autocall-broadcast')
    .post(_controller.reportAutocallBroadcast);

router
    .route('/report-autocall-survey')
    .post(_controller.reportAutocallSurvey);

router
    .route('/report-autocall-survey2')
    .post(_controller.reportAutocallSurvey2);

router
    .route('/report-inbound-impact-by-agent')
    .get(_controller.reportInboundImpactByAgent);

router
    .route('/report-call-by-customer-kh01')
    .get(_controller.reportCallByCustomerKH01);

router
    .route('/report-detail-statistical-status-end-call')
    .get(_controller.reportDetailStatisticalStatusEndCall);

router
    .route('/report-inbound-misscall-and-connected-by-agent')
    .get(_controller.reportInboundMisscallAndConnectedByAgent);

router
    .route('/report-inbound-by-agent')
    .get(_controller.reportInboundByAgent);


module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/