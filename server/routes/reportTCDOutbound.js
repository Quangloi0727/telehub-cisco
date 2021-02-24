const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportTCDGroupbyController');

router
    .route('/report-outbound-overall-agent-productivity')
    .get(_controller.callDisposition);



module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/