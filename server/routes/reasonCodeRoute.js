const express = require("express");
let router = express.Router();
let _controller = require("../controllers/reasonCodeController");

router.route("/").get(_controller.getAll);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/
