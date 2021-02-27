const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportReasonDropCallController');

router
    .route('/reportReasonDropCall')
    .get(_controller.getReportReasonDropCall);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/