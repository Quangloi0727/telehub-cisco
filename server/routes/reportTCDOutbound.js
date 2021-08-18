const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportTCDOutboundController');

router
    .route('/report-outbound-overall-agent-productivity')
    .get(_controller.reportOutboundAgentProductivity);

router
    .route('/report-outbound-overall-productivity-by-agent')
    .get(_controller.reportOutboundOverallProductivityByAgent);

router
    .route('/report-outbound-agent')
    .get(_controller.reportOutboundAgent);

router
    .route('/report-outbound-agent-detail')
    .get(_controller.reportOutboundAgentProductivityDetail);

router
    .route('/report-outbound-daily')
    .get(_controller.reportOutboundDaily);

router
    .route('/report-outbound-daily-by-agent')
    .get(_controller.reportOutboundDailyByAgent);

router
    .route('/report-outbound-overall-pds')
    .get(_controller.reportOutboundOverallPDS);

// Báo cáo này được sử dụng trong dự án migrate PVI-HCM 
router
    .route('/report-outbound-total-call-by-time')
    .get(_controller.reportOutboundTotalCallByTime);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/