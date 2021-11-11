const express = require('express');
let router = express.Router();
let controller = require('../controllers/reportDoNotCallController');

router.route('/report-do-not-call').get(controller.reportDoNotCall);

module.exports = router;