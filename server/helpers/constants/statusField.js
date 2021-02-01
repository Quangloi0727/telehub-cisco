const TYPE_ADS = {
  google: {
    number: 0,
    text: "Google",
  },
  local: {
    number: 1,
    text: "Ảnh từ hệ thống",
  },
};
/**
 * Message define telehub
    "TXT_TYPE_1": "KH dập máy khi nghe IVR",
    "TXT_TYPE_2": "KH dập máy khi đang ring agent",
    "TXT_TYPE_3": "ĐTV không nhấc máy",
    "TXT_TYPE_4": "ĐTV reject",
    "TXT_TYPE_5": "Tất cả ĐTV đều bận",
    "TXT_TYPE_OTHER": "Lý do khác",
 */
const TYPE_MISSCALL = {
  MissIVR: {
    value: 1,
    id: "MissIVR",
  },
  CustomerEndRinging: {
    value: 2,
    id: "CustomerEndRinging",
  },
  MissAgent: {
    value: 3,
    id: "MissAgent",
  },
  RejectByAgent: {
    value: 4,
    id: "RejectByAgent",
  },
  MissQueue: {
    value: 5,
    id: "MissQueue",
  },
  MissShortCall: {
    value: 8,
    id: "MissShortCall", // các cuộc agent nhấc máy nhưng duration < 5s (5s ko chắc) và callDiposition = 7 | 6
  },
  Other: {
    value: 6,
    id: "OTHER",
  },
};

const TYPE_CALL_HANDLE = {
  value: 7,
  id: "HandleByAgent",
};

const TYPE_CALLTYPE = {
  CT_ToAgentGroup: "CT_ToAgentGroup",
  CT_Queue: "CT_Queue",
  CT_IVR: "CT_IVR",
  CT_Tranfer: "CT_Tranfer",
  unknown: "unknown",
};

/**
 * Định nghĩa theo cisco
 */
const Agent_REAL_TIME = {
  AgentState: {
    0: "Logged Out",
    1: "Logged On",
    2: "Not Ready",
    3: "Ready",
    4: "Talking",
    5: "Work Not Ready",
    6: "Work Ready",
    7: "Busy Other",
    8: "Reserved",
    9: "Unknown",
    10: "Hold",
    11: "Active",
    12: "Paused",
    13: "Interrupted",
    14: "Not Active",
  },
  PhoneType: {
    0: "Not Mobile",
    1: "Call By Call",
    2: "Nailed Connection",
  },
  Destination: {
    1: "ACD",
    2: "Direct",
    3: "Auto Out",
    4: "Reserve",
    5: "Preview",
  },
  Direction: {
    1: "In",
    2: "Out",
    3: "Other In",
    4: "Other Out",
    5: "Out Reserve",
    6: "Out Preview",
    7: "Out Predictive",
  },
  NotFound: {
    PhoneType: "Not Applicable",
    Destination: "Not Applicable",
    Direction: "Not Applicable",
  },
};

/**
 * Định nghĩa của cisco
 * https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cust_contact/contact_center/finesse/finesse_1201/Admin/guide/cfin_b_1201-administration-guide-release-1201/cfin_b_1201-administration-guide-release-1201_chapter_0110.html#reference_DA919E953FB4F73AD9CA3A35542D5158
 */
const REASON_CODE = [
  {
    rc: "32767",
    rl: "Not Ready - Call Not Answered",
    rld: "Agent state changed because the agent did not answer the call.",
  },
  {
    rc: "32762",
    rl: "Not Ready - Offhook",
    rld: "The system issues this reason code in the following scenarios:",
  },
  {
    rc: "50001",
    rl: "Logged Out - System Disconnect",
    rld: "The CTI OS client disconnected, logging the agent out.",
  },
  {
    rc: "50002",
    rl: "Logged Out - System Failure",
    rld:
      "A CTI OS component disconnected, causing the agent to be logged out or set to the Not Ready state. This could be due to closing\n                                          the agent desktop application, heart beat time out, or a CTI OS Server failure. \n                                      ",
  },
  {
    rc: "50002",
    rl: "Not Ready - Connection Failure",
    rld:
      "The system issues this reason code when the agent is forcibly logged out in certain cases.",
  },
  {
    rc: "50003",
    rl: "Logged Out - Device Error",
    rld:
      "Agent was logged out because the Unified CM reported the device out of service.",
  },
  {
    rc: "50004",
    rl: "Logged Out - Inactivity Timeout",
    rld:
      "Agent was logged out due to agent inactivity as configured in agent desk settings.",
  },
  {
    rc: "50005",
    rl: "Not Ready - Non ACD Busy",
    rld:
      " For a Unified CCE agent deployment, where the Agent Phone Line Control is enabled in the peripheral and the Non ACD Line\n                                          Impact is configured to impact agent state, the agent is set to Not Ready while talking on a call on the Non ACD line with\n                                          this reason code. \n                                      ",
  },
  {
    rc: "50010",
    rl: "Not Ready - Call Overlap",
    rld:
      "Agent was set to Not Ready state because the agent was routed two consecutive calls that did not arrive.",
  },
  {
    rc: "50020",
    rl: "Logged Out - Queue Change",
    rld:
      "Agent was logged out when the agent's skill group dynamically changed on the Administration &amp; Data Server.",
  },
  {
    rc: "50030",
    rl: "Logged Out - Device Conflict",
    rld:
      "If an agent is logged in to a dynamic device target that is using the same Dialed Number (DN) as the PG static device target,\n                                          the agent is logged out. \n                                      ",
  },
  {
    rc: "50040",
    rl: "Logged Out - Mobile Agent Call Fail",
    rld: "Mobile agent was logged out because the call failed.",
  },
  {
    rc: "50041",
    rl: "Not Ready - Mobile Call Not Answered",
    rld:
      "Mobile agent state changed to Not Ready because the call fails when the mobile agent's phone line rings busy.",
  },
  {
    rc: "50042",
    rl: "Logged Out - Mobile Agent Disconnect",
    rld:
      "Mobile agent was logged out because the phone line disconnected while using nailed connection mode.",
  },
  {
    rc: "65535",
    rl: "Not Ready - System Reinitialized",
    rld: "Agent reinitialized (used if peripheral restarts).",
  },
  {
    rc: "65534",
    rl: "Not Ready - System Reset",
    rld: "PG reset the agent, normally due to a PG failure.",
  },
  {
    rc: "65533",
    rl: "Not Ready - Extension Modified",
    rld:
      "An administrator modified the agent's extension while the agent was logged in.",
  },
  {
    rc: "20001",
    rl: "Not Ready - Starting Force Logout",
    rld:
      " Places the agent in the Not Ready state first before forcefully logging them off.",
  },
  {
    rc: "20002",
    rl: "Logged Out - Force Logout",
    rld:
      "Forces the logout request; for example, when Agent A attempts to log in to Cisco Agent Desktop and Agent B is already logged\n                                          in under that agent ID, Agent A is asked whether or not to force the login. If Agent A answers yes, Agent B is logged out\n                                          and Agent A is logged in. Reports then show that Agent B logged out at a certain time with a reason code of 20002 (Agent B\n                                          was forcibly logged out). \n                                      ",
  },
  {
    rc: "20003",
    rl: "Not Ready - Agent Logout Request",
    rld:
      "If not already in the Logout state, request is made to place agent in the Not Ready state. Then logout request is made to\n                                          log agent out. \n                                      ",
  },
  {
    rc: "999",
    rl: "Not Ready - Supervisor Initiated",
    rld:
      "The system issues this reason code when the agent’s state is forcibly changed to Not Ready by the Supervisor.",
  },
  {
    rc: "999",
    rl: "Logged Out - Supervisor Initiated",
    rld:
      "The system issues this reason code when the agent’s state is forcibly changed to Logout by the Supervisor.",
  },
  {
    rc: "255",
    rl: "Logged Out - Connection Failure",
    rld:
      "The system issues this reason code when the agent is forcibly logged out when there is a connection failure between the Cisco\n                                          Finesse Desktop and the Cisco Finesse Server. \n                                      ",
  },
];

// https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cust_contact/contact_center/ipcc_enterprise/ippcenterprise10_0_1/reference/UCCE_BK_D3D5FB15_00_1001-database-schema-guide-for-ucce/UCCE_BK_D3D5FB15_00_10-0-1-database-schema-guide-for-ucce_chapter_010.html
/**
 * 
Direction of call on which the agent is currently working:

NULL= None
0 = None
1 = In (non-voice tasks are always inbound)
2 = Out
3 = Other In
4 = Other Out/Direct Preview
5 = Outbound Reserve
6 = Outbound Preview
7 = Outbound Predictive/Progressive
 */
const CALL_DIRECTION = {
  in: {
    num: 1,
    text: 'In',
  },
  out: {
    num: 2,
    text: 'Out',
  },
};
// data = [];

// $(
//   "#reference_E74540548AEB39553C82AE091C232CD4__section_F07C77AEB80B4D08B973EC14FAD915CA table tbody tr"
// ).each((i, item) => {
//   const ele = $(item);
//   const rc = ele.find("td:nth-child(1) p").html();
//   const rl = ele.find("td:nth-child(2) p").html();
//   const rld = ele.find("td:nth-child(3) p").html();
//   data.push({ rc, rl, rld });
// });
// JSON.stringify({ data });

module.exports = {
  TYPE_ADS,
  TYPE_MISSCALL,
  TYPE_CALL_HANDLE,
  TYPE_CALLTYPE,
  Agent_REAL_TIME,
  REASON_CODE,
  CALL_DIRECTION,
};
