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
    let CT_ToAgent_Dynamic = [];
    let CT_Queue_Dynamic = [];

    Object.keys(query).forEach(item => {
      const element = query[item];
      if (
        item.includes("CT_ToAgentGroup")
      ) {
        CT_ToAgent_Dynamic.push(`@${item}`);
      }

      if (
        item.includes("CT_Queue")
      ) {
        CT_Queue_Dynamic.push(`@${item}`);
      }

    });


    let _query = `
    ${variableSQLDynamic(query)}
    SELECT
      AgentSkillTargetID
     ,AgentPeripheralNumber
     ,DATEPART(HOUR, CallTypeReportingDateTime) HourBlock
     ,DATEPART(DAY, CallTypeReportingDateTime) DayBlock
     ,DATEPART(MONTH, CallTypeReportingDateTime) MonthBlock
     ,DATEPART(YEAR, CallTypeReportingDateTime) YearBlock
     ,FORMAT(CallTypeReportingDateTime, 'yyyy-MM-dd-HH') timeBlock
     ,DateTime
     ,CallTypeReportingDateTime
     ,RouterCallKey
     ,RouterCallKeyDay
     ,PeripheralCallKey
    FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail]
      WHERE DateTime >= @startDate
      and DateTime < @endDate
      --AND CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(",")})
      and PeripheralCallType in (9, 10) -- 13: cuộc gọi inbound, 6: cuộc gọi tranfer
      --AND SkillGroupSkillTargetID is not null
      AND AgentSkillTargetID is not null -- sau nay 
      AND TalkTime > 0
  `;
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
        TCD_Table.[PeripheralCallType] IN (9, 10)
        AND TCD_Table.[AgentSkillTargetID] IS NOT NULL
        AND TCD_Table.[DigitsDialed] IS NOT NULL
        AND Agent_Table.[PeripheralNumber] IS NOT NULL 
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
