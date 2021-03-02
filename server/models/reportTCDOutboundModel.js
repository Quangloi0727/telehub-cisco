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
const {
  checkKeyValueExists,
  reasonToTelehub,
  variableSQL,
  variableSQLDynamic,
} = require("../helpers/functions");
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
    // let CT_ToAgent_Dynamic = [];
    // let CT_Queue_Dynamic = [];

    // Object.keys(query).forEach(item => {
    //   const element = query[item];
    //   if (
    //     item.includes("CT_ToAgentGroup")
    //   ) {
    //     CT_ToAgent_Dynamic.push(`@${item}`);
    //   }

    //   if (
    //     item.includes("CT_Queue")
    //   ) {
    //     CT_Queue_Dynamic.push(`@${item}`);
    //   }

    // });
    let { Agent_Team } = query;

    let _query = `
    ${variableSQLDynamic(query)}
    SELECT
      aw_TCD.AgentSkillTargetID
     ,aw_TCD.AgentPeripheralNumber
     ,DATEPART(HOUR, aw_TCD.CallTypeReportingDateTime) HourBlock
     ,DATEPART(DAY, aw_TCD.CallTypeReportingDateTime) DayBlock
     ,DATEPART(MONTH, aw_TCD.CallTypeReportingDateTime) MonthBlock
     ,DATEPART(YEAR, aw_TCD.CallTypeReportingDateTime) YearBlock
     ,FORMAT(aw_TCD.CallTypeReportingDateTime, 'yyyy-MM-dd-HH') timeBlock
     ,aw_TCD.DateTime
     ,aw_TCD.CallTypeReportingDateTime
     ,aw_TCD.RouterCallKey
     ,aw_TCD.RouterCallKeyDay
     ,aw_TCD.PeripheralCallKey
    FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail] aw_TCD
    INNER JOIN [${DB_AWDB}].[dbo].[t_Agent_Team_Member] aw_Agent_Team_Member
      ON  aw_Agent_Team_Member.SkillTargetID = aw_TCD.AgentSkillTargetID
      AND  aw_Agent_Team_Member.AgentTeamID = ${Agent_Team}
    WHERE DateTime >= @startDate
      AND DateTime < @endDate
      AND PeripheralCallType in (9, 10)
      AND AgentSkillTargetID is not null 
  `;
    _logger.log('info', `reportOutboundAgent ${_query}`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
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
      agentTeamId,
    } = query;

    let queryAgent = '';
    let queryStartDate = '';
    let queryEndDate = '';

    if (startDate) queryStartDate = `AND TCD_Table.[DateTime] >= '${startDate}'`;
    if (endDate) queryEndDate = `AND TCD_Table.[DateTime] <= '${endDate}'`;
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
        INNER JOIN [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Agent_Team 
          ON Agent_Team.[SkillTargetID] = TCD_Table.[AgentSkillTargetID]
          AND Agent_Team.[AgentTeamID] = ${agentTeamId}
      WHERE
        TCD_Table.[PeripheralCallType] IN (9, 10)
        AND TCD_Table.[AgentSkillTargetID] IS NOT NULL
        -- AND Agent_Table.[PeripheralNumber] IS NOT NULL
        ${queryAgent}
        ${queryStartDate}
        ${queryEndDate}
      GROUP BY
      Agent_Table.[PeripheralNumber]
    `;

    console.log(`------- _queryData ------- query reportOutboundAgentProductivity`);
    console.log(_queryData);
    console.log(`------- _queryData ------- query reportOutboundAgentProductivity`);

    let queryResult = await dbMssql.query(_queryData);

    return queryResult;
  } catch (error) {
    throw new Error(error);
  }
};
