const express = require('express');
let router = express.Router();
let _controller = require('../controllers/dataTCDInboundController');

router
    .route('/dataTCDInboundHandle')
    .get(_controller.dataTCDRecordAdvanced);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/