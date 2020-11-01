const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportTCDCallTypeAgentDetailController');

router
    .route('/')
    .get(_controller.getAll);

router
    .route('/byHourBlock')
    .get(_controller.getByHourBlock);

router
    .route('/detailAgent')
    .get(_controller.getDetailAgent);

router
    .route('/getGroupByCallDisposition')
    .get(_controller.getGroupByCallDisposition);

router
    .route('/missCall')
    .get(_controller.missCall);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/