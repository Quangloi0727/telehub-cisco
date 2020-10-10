const express = require('express');
let router = express.Router();
let callTypeController = require('../controllers/callTypeController');

router
    .route('/')
    .get(callTypeController.getAll)

// /**
//  * Chỉ nhận params từ a-z 0-9 và có độ dài bằng 24
//  */
router
    .route('/:id([0-9a-f]{24})')
    // .get(callTypeController.getByIDIntro)

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/