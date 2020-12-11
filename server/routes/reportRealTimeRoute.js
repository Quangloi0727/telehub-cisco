const express = require('express');
let router = express.Router();
let _controler = require('../controllers/reportRealTimeController');

// router
//     .route('/')
//     .get(_controler.getAll);

router
    .route('/agentTeam')
    .get(_controler.agentTeam);


module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/