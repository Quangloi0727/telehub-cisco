const express = require('express');
let router = express.Router();
let skillGroupController = require('../controllers/skillGroupController');

// router
//     .route('/')
//     .get(skillGroupController.getAll)

router
    .route('/distinctTCD')
    .get(skillGroupController.distinctTCD)

// /**
//  * Chỉ nhận params từ a-z 0-9 và có độ dài bằng 24
//  */
router
    .route('/:id([0-9a-f]{24})')
    // .get(skillGroupController.getByIDIntro)

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/