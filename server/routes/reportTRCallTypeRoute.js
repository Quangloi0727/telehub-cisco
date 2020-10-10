const express = require('express');
let router = express.Router();
let reportTRCallTypeController = require('../controllers/reportTRCallTypeController');

router
    .route('/')
    .get(reportTRCallTypeController.getAll);


module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/