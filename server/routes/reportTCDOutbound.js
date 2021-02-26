const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportTCDOutboundController');

router
    .route('/report-outbound-overall-agent-productivity')
    .get(_controller.reportOutboundAgentProductivity);

router
    .route('/report-outbound-agent')
    .get(_controller.reportOutboundAgent);



module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/