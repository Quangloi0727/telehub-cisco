const express = require('express');
let router = express.Router();
let _controller = require('../controllers/callDetailController');

router
    .route('/handleByAgent')
    .get(_controller.handleByAgent);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/