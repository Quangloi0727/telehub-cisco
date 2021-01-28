const express = require('express');
let router = express.Router();
let surveyController = require('../controllers/surveyController');

router
    .route('/getSurveyByPrefix')
    .get(surveyController.getSurveyByPrefix);

module.exports = router;