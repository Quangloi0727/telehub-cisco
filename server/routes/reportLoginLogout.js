const express = require('express');
let router = express.Router();
let _controler = require('../controllers/reportLoginLogout');

router.route('/report-login-logout').get(_controler.reportLoginLogout);

module.exports = router;