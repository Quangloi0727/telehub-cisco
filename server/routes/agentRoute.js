const express = require('express');
let router = express.Router();
let agentController = require('../controllers/agentController');

router
    .route('/')
    .get(agentController.getAllIntro)
    .post(agentController.createIntro)

// /**
//  * Chỉ nhận params từ a-z 0-9 và có độ dài bằng 24
//  */
router
    .route('/:id([0-9a-f]{24})')
    .get(agentController.getByIDIntro)

router
    .get('/last', agentController.getLast);

router
    .get('/download', agentController.download);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/