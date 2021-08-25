const express = require('express');
let router = express.Router();
let agentController = require('../controllers/agentController');

router
    .route('/')
    .get(agentController.getAll);

router
    .route('/AgentMemberTeam')
    .get(agentController.agentMemberTeam);

router
    .route('/AgentTeam')
    .get(agentController.agentTeam);

// /**
//  * Chỉ nhận params từ a-z 0-9 và có độ dài bằng 24
//  */
router
    .route('/:id([0-9a-f]{24})')
// .get(agentController.getByIDIntro)

router.route('/agent-by-company')
    .get(agentController.getAgentsByCompany);

router.route('/reset-pass')
    .post(agentController.resetPass);

module.exports = router;

/**
 * (\\d+) : Chỉ nhận params là số
 *
 **/