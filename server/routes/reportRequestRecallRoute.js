const express = require('express');
let router = express.Router();
let _controller = require('../controllers/reportRequestRecallController');

router
    .route('/reportRequestRecall')
    .get(_controller.reportRequestRecall);

module.exports = router;
