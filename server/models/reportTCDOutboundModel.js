const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const {
  DB_HDS,
  DB_AWDB,
  DB_RECORDING,
} = process.env;

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
 * API lấy dữ liệu cuộc gọi ra tổng hợp agent
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , prefix: '71000'
 *   , agentID: '5015'
 *    }
 */

exports.reportOutboundAgentProductivity = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      agentId,
      prefix = 71000,
    } = query;

    let queryAgent = '';
    let queryStartDate = '';
    let queryEndDate = '';

    if (startDate) queryStartDate = `AND TCD_Table.[DateTime] >= '${startDate}'`;
    if (endDate) queryEndDate = `AND TCD_Table.[DateTime] < '${endDate}'`;
    if (agentId) queryAgent = `AND Agent_Table.[PeripheralNumber] IN ( ${agentId} )`;

    let _queryData = `
      SELECT
        Agent_Table.[PeripheralNumber] agentID,
        SUM ( 1 ) AS totalCall,
        SUM ( TCD_Table.[Duration] ) AS totalCallTime,
        AVG ( TCD_Table.[Duration] ) AS avgCallTime,
        SUM ( CASE WHEN TCD_Table.[TalkTime] > 0 THEN 1 ELSE 0 END ) AS totalCallConnect,
        SUM ( TCD_Table.[DelayTime] ) AS totalWaitTime,
        SUM ( TCD_Table.[TalkTime] ) AS totalTalkTime,
        AVG ( TCD_Table.[TalkTime] ) AS avgTalkTime 
      FROM
        [${DB_HDS}].[dbo].[t_Termination_Call_Detail] TCD_Table
        LEFT JOIN [${DB_AWDB}].[dbo].[t_Agent] Agent_Table ON Agent_Table.[SkillTargetID] = TCD_Table.[AgentSkillTargetID]
        LEFT JOIN [${DB_AWDB}].[dbo].[t_Skill_Group] Skill_Group_Table ON Skill_Group_Table.[SkillTargetID] = TCD_Table.[SkillGroupSkillTargetID] 
      WHERE
        TCD_Table.[DigitsDialed] LIKE '%${prefix}%' 
        ${queryAgent}
        ${queryStartDate}
        ${queryEndDate}
      GROUP BY
      Agent_Table.[PeripheralNumber]
    `;
    let queryResult = await dbMssql.query(_queryData);

    return queryResult;
  } catch (error) {
    throw new Error(error);
  }
};
