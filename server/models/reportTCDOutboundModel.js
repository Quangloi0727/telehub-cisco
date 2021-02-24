const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

/**
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-13 00:00:00'
 *   , endDate: '2020-10-13 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 *  2020/10/30: ko dùng nữa.
 */

exports.reportOutboundAgent = async (db, dbMssql, query) => {
  try {
    let {

    } = query;
  } catch (error) {

  }
};

/**
 * API lấy dữ liệu cuộc gọi nhỡ tổng hợp theo SkillGroup
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , campain: '5014'
 *   , agent: '5015'
 *    }
 */

exports.reportOutboundOverallAgentProductivity = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      agentID,
    } = query;

    let queryAgent = '';
    let queryStartDate = '';
    let queryEndDate = '';

    if (agentID || agentID != '') queryAgent = `AND TCD_Table.[AgentSkillTargetID] = ${agentID}`;
    if (startDate) queryStartDate = `AND TCD_Table.[DateTime] >= '${startDate}'`
    if (endDate) queryEndDate = `AND TCD_Table.[DateTime] < '${endDate}'`

    let _queryData = `
      SELECT
        TCD_Table.[AgentSkillTargetID] AgentID,
        SUM ( 1 ) AS Total_Call,
        SUM ( TCD_Table.[Duration] ) AS Total_Call_Time,
        AVG ( TCD_Table.[Duration] ) AS Avg_Call_Time,
        SUM ( CASE WHEN TCD_Table.[TalkTime] > 0 THEN 1 ELSE 0 END ) AS Total_Call_Connect,
        SUM ( TCD_Table.[DelayTime] ) AS Total_Wait_Time,
        SUM ( TCD_Table.[TalkTime] ) AS Total_Talk_Time,
        AVG ( TCD_Table.[TalkTime] ) AS AVG_Talk_Time 
      FROM
        [ins1_hds].[dbo].[t_Termination_Call_Detail] TCD_Table
        LEFT JOIN [ins1_awdb].[dbo].[t_Agent] Agent_Table ON Agent_Table.[SkillTargetID] = TCD_Table.[AgentSkillTargetID]
        LEFT JOIN [ins1_awdb].[dbo].[t_Skill_Group] Skill_Group_Table ON Skill_Group_Table.[SkillTargetID] = TCD_Table.[SkillGroupSkillTargetID] 
      WHERE
        TCD_Table.[DigitsDialed] LIKE '%71000%' 
        ${queryAgent}
        ${startDate}
        ${queryEndDate}
      GROUP BY
        TCD_Table.AgentSkillTargetID;
    `;

  } catch (error) {
    throw new Error(error);
  }
};
