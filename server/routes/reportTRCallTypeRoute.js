const express = require('express');
let router = express.Router();
let reportTRCallTypeController = require('../controllers/reportTRCallTypeController');

router
    .route('/')
    .get(reportTRCallTypeController.getAll);

router
    .route('/lastTCDRecord')
    .get(reportTRCallTypeController.lastTCDRecord);
router
    .route('/statisticInHourByDay')
    .get(reportTRCallTypeController.statisticInHourByDay);


module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/