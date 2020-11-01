const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportTCDGroupbyController');

router
    .route('/callDisposition')
    .get(_controller.callDisposition);

router
    .route('/skillGroup')
    .get(_controller.skillGroup);

router
    .route('/skillGroupMapping')
    .get(_controller.skillGroupMapping);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/