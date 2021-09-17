const express = require('express');
let router = express.Router();
let _controler = require('../controllers/reportLoginLogout');

router.route('/report-login-logout').get(_controler.reportLoginLogout);

/**
 * API này có chức năng lấy ra các trạng thái và thời gian login logout của agent
 * Vì sao có API này:
 * - API này được dựa trên API 'report-login-logout'
 * - Vì có một số dự án yêu cầu lấy ra các loại Status khác nhau như:
 *    + AtLunch
 *    + Meeting
 *    + NoACD
 *    + NoAvailable
 *    + Not Ready
 *    + Training
 *    + Xu Ly Phieu
 *  - Vì vậy API này được tạo ra để nhằm đáp ứng nhu cầu của khách hàng
 */
router.route('/report-change-status').get(_controler.reportChangeStatus);

module.exports = router;