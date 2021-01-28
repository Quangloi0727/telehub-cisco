const express = require('express');
let router = express.Router();
let surveyController = require('../controllers/getListSurveyController');

router
    .route('/getSurveyByPrefix')
    .get(surveyController.getSurveyByPrefix);

module.exports = router;