const express = require('express');
let router = express.Router();
let surveyController = require('../controllers/dialedNumberController');

router
    .route('/getDialedNumberByPrefix')
    .get(surveyController.getDialedNumberByPrefix);

module.exports = router;