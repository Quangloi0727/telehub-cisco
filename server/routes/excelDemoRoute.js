const express = require('express');
let router = express.Router();
let excelDemoController = require('../controllers/excelDemoController');

router
    .route('/')
    .get(excelDemoController.getAll);


module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/