const express = require('express');
let router = express.Router();
let _controller = require('../controllers/procedureController');

router
    .route('/report-autocall-broadcast')
    .post(_controller.reportAutocallBroadcast);


module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/