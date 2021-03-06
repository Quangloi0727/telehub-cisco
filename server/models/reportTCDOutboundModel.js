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
      AND PeripheralCallType in (9, 10, 33)
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
      exportExcel
    } = query;

    let queryAgent = '';
    let queryStartDate = '';
    let queryEndDate = '';
    let queryExcelSelect = '';
    let queryExcelGroupBy = '';

    if (startDate) queryStartDate = `AND TCD_Table.[DateTime] >= '${startDate}'`;
    if (endDate) queryEndDate = `AND TCD_Table.[DateTime] <= '${endDate}'`;
    if (agentId) queryAgent = `AND Agent_Table.[PeripheralNumber] IN ( ${agentId} )`;
    if (exportExcel) queryExcelSelect = `DATEPART(hour,TCD_Table.[DateTime]) AS blockTime,`;
    if (exportExcel) queryExcelGroupBy = `,DATEPART(hour,TCD_Table.[DateTime])`;

    let _queryData = `
      SELECT
        Agent_Table.[PeripheralNumber] agentID,
        ${queryExcelSelect}
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
          AND Agent_Team.[AgentTeamID] IN (${agentTeamId})
      WHERE
        TCD_Table.[PeripheralCallType] IN (9, 10, 33)
        AND TCD_Table.[AgentSkillTargetID] IS NOT NULL
        -- AND Agent_Table.[PeripheralNumber] IS NOT NULL
        ${queryAgent}
        ${queryStartDate}
        ${queryEndDate}
      GROUP BY
      Agent_Table.[PeripheralNumber]
      ${queryExcelGroupBy}
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

exports.reportOutboundOverallProductivityByAgent = async (db, dbMssql, query) => {
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
      Agent_Table.[PeripheralNumber] agentId,
      CAST ( TCD_Table.[DateTime] AS DATE ) AS createDate,
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
      INNER JOIN [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Agent_Team ON Agent_Team.[SkillTargetID] = TCD_Table.[AgentSkillTargetID] 
      AND Agent_Team.[AgentTeamID] IN ( ${agentTeamId} ) 
    WHERE
      TCD_Table.[PeripheralCallType] IN ( 9, 10, 33 ) 
      AND TCD_Table.[AgentSkillTargetID] IS NOT NULL 
      ${queryAgent} 
      ${queryStartDate}
      ${queryEndDate}
    GROUP BY
      CAST ( TCD_Table.[DateTime] AS DATE ), Agent_Table.[PeripheralNumber]
    ORDER BY createDate ASC
    `;

    console.log(`------- _queryData ------- query reportOutboundOverallProductivityByAgent`);
    console.log(_queryData);
    console.log(`------- _queryData ------- query reportOutboundOverallProductivityByAgent`);

    let queryResult = await dbMssql.query(_queryData);

    return queryResult;
  } catch (error) {
    throw new Error(error);
  }
};


exports.reportOutboundOverallProductivityDetail = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      agentId,
      agentTeamId,
      page
    } = query;

    let queryPaging = '';
    let queryAgent = '';
    let queryStartDate = '';
    let queryEndDate = '';

    if (page) queryPaging = `OFFSET ${query.skip} ROWS FETCH NEXT ${query.limit} ROWS ONLY`;
    if (startDate) queryStartDate = `AND TCD_Table.[DateTime] >= '${startDate}'`;
    if (endDate) queryEndDate = `AND TCD_Table.[DateTime] <= '${endDate}'`;
    if (agentId) queryAgent = `AND Agent_Table.[PeripheralNumber] IN ( ${agentId} )`;

    let _queryData = `
      SELECT
        TCD_Table.[RecoveryKey] callId,
        Agent_Table.[PeripheralNumber] agentId,
        TCD_Table.[DateTime] createDate,
        TCD_Table.[Duration] callTime,
        TCD_Table.[NetworkTime],
        TCD_Table.[RingTime],
        TCD_Table.[DelayTime] delayTime,
        TCD_Table.[TimeToAband],
        TCD_Table.[HoldTime] holdTime,
        TCD_Table.[TalkTime] talkTime,
        TCD_Table.[WorkTime],
        TCD_Table.[LocalQTime],
        TCD_Table.[DigitsDialed] digitsDialed,
        TCD_Table.[PeripheralID],
        TCD_Table.[PeripheralCallType],
        TCD_Table.[PeripheralCallKey],
        TCD_Table.[CallDisposition]
      FROM
        [${DB_HDS}].[dbo].[t_Termination_Call_Detail] TCD_Table
        LEFT JOIN [${DB_AWDB}].[dbo].[t_Agent] Agent_Table ON Agent_Table.[SkillTargetID] = TCD_Table.[AgentSkillTargetID]
        LEFT JOIN [${DB_AWDB}].[dbo].[t_Skill_Group] Skill_Group_Table ON Skill_Group_Table.[SkillTargetID] = TCD_Table.[SkillGroupSkillTargetID]
        INNER JOIN [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Agent_Team ON Agent_Team.[SkillTargetID] = TCD_Table.[AgentSkillTargetID] 
        AND Agent_Team.[AgentTeamID] IN ( ${agentTeamId} ) 
      WHERE
        TCD_Table.[PeripheralCallType] IN ( 9, 10, 33 )
        AND TCD_Table.[AgentSkillTargetID] IS NOT NULL
        ${queryAgent}
        ${queryStartDate}
        ${queryEndDate}
        ORDER BY TCD_Table.[DateTime] ASC ${queryPaging}
    `;

    console.log(`------- _queryData ------- query reportOutboundOverallProductivityDetail`);
    console.log(_queryData);
    console.log(`------- _queryData ------- query reportOutboundOverallProductivityDetail`);

    let queryResult = await dbMssql.query(_queryData);

    return queryResult;
  } catch (error) {
    throw new Error(error);
  }
};

exports.countNumRowsTCD = async (db, dbMssql, query) => {
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
        count(*) as numRows
      FROM
        [${DB_HDS}].[dbo].[t_Termination_Call_Detail] TCD_Table
        LEFT JOIN [${DB_AWDB}].[dbo].[t_Agent] Agent_Table ON Agent_Table.[SkillTargetID] = TCD_Table.[AgentSkillTargetID]
        LEFT JOIN [${DB_AWDB}].[dbo].[t_Skill_Group] Skill_Group_Table ON Skill_Group_Table.[SkillTargetID] = TCD_Table.[SkillGroupSkillTargetID]
        INNER JOIN [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Agent_Team ON Agent_Team.[SkillTargetID] = TCD_Table.[AgentSkillTargetID] 
        AND Agent_Team.[AgentTeamID] IN ( ${agentTeamId} ) 
      WHERE
        TCD_Table.[PeripheralCallType] IN ( 9, 10, 33 )
        AND TCD_Table.[AgentSkillTargetID] IS NOT NULL
        ${queryAgent}
        ${queryStartDate}
        ${queryEndDate}
      `;

    console.log(`------- _queryData ------- query countNumRowsTCD`);
    console.log(_queryData);
    console.log(`------- _queryData ------- query countNumRowsTCD`);

    let queryResult = await dbMssql.query(_queryData);

    return queryResult;
  } catch (error) {
    throw new Error(error);
  }
}

exports.reportOutboundByTime = async (db, dbMssql, query) => {
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
      FORMAT (TCD_Table.[DateTime], 'MM/yyyy') AS createDate,
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
      INNER JOIN [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Agent_Team ON Agent_Team.[SkillTargetID] = TCD_Table.[AgentSkillTargetID] 
      AND Agent_Team.[AgentTeamID] IN ( ${agentTeamId} ) 
    WHERE
      TCD_Table.[PeripheralCallType] IN ( 9, 10, 33 ) 
      AND TCD_Table.[AgentSkillTargetID] IS NOT NULL 
      ${queryAgent} 
      ${queryStartDate}
      ${queryEndDate}
    GROUP BY
    FORMAT (TCD_Table.[DateTime], 'MM/yyyy')
    ORDER BY createDate ASC
    `;

    console.log(`------- _queryData ------- query reportOutboundByTime`);
    console.log(_queryData);
    console.log(`------- _queryData ------- query reportOutboundByTime`);

    let queryResult = await dbMssql.query(_queryData);

    return queryResult;
  } catch (error) {
    throw new Error(error);
  }
};

// Báo cáo này được sử dụng trong dự án migrate PVI-HCM 
exports.reportOutboundDaily = async (db, dbMssql, query) => {
  try {
    const { startTime, endTime, type, agents, agentTeams, campaigns } = query;
    let _query = '';

    if (type == 'login-daily') {
      _query = `USE ins1_recording exec total_agent_login_per_day_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'`;
    }

    if (type == 'click-to-call-daily') {
      _query = `USE ins1_recording exec report_total_click_to_call_per_day_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'`;
    }

    if (type == 'auto-dialing-daily') {
      _query = `USE ins1_recording exec report_total_auto_dialing_per_day_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}', '${campaigns}'`;
    }

    console.info(`------- _query ------- reportOutboundDaily`);
    console.info(_query);
    console.info(`------- _query ------- reportOutboundDaily`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
}

// Báo cáo này được sử dụng trong dự án migrate PVI-HCM 
exports.reportOutboundDailyByAgent = async (db, dbMssql, query) => {
  try {
    const { startTime, endTime, type, agents, agentTeams, campaigns } = query;
    let _query = '';

    if (type == 'login-daily') {
      _query = `USE ins1_recording exec total_login_daily_by_agent_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'`;
    }

    if (type == 'click-to-call-daily') {
      _query = `USE ins1_recording exec report_total_click_to_call_daily_by_day_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}'`;
    }

    if (type == 'auto-dialing-daily') {
      _query = `USE ins1_recording exec report_total_auto_dialing_daily_by_agent_sp '${startTime}', '${endTime}', '${agentTeams}', '${agents || '#'}', '${campaigns}'`;
    }

    console.info(`------- _query ------- reportOutboundDailyByAgent`);
    console.info(_query);
    console.info(`------- _query ------- reportOutboundDailyByAgent`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
}

// Báo cáo này được sử dụng trong dự án migrate PVI-HCM 
exports.reportOutboundOverallPDS = async (db, dbMssql, query) => {
  try {
    const { startTime, endTime, type, campaigns } = query;
    let _query = '';

    if (type == 'total-call') {
      _query = `USE ins1_recording exec report_total_call_auto_dialing_sp '${startTime}', '${endTime}', '${campaigns}'`;
    }

    if (type == 'total-time') {
      _query = `USE ins1_recording exec report_total_call_auto_dialing_detail_sp '${startTime}', '${endTime}', '${campaigns}'`;
    }

    console.info(`------- _query ------- reportOutboundOverallPDS`);
    console.info(_query);
    console.info(`------- _query ------- reportOutboundOverallPDS`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
}

// Báo cáo này được sử dụng trong dự án migrate PVI-HCM 
exports.reportOutboundTotalCallByTime = async (db, dbMssql, query) => {
  try {
    const {
      startTime,
      endTime,
      type,
      agentTeams,
      campaigns = '#',
      dateStr = '#',
      agentId = '#',
      isFindPDS,
      isFindC2C
    } = query;
    let _query = '';

    if (type == 'by-month') {
      _query = `
        USE ins1_recording exec report_outbound_total_call_by_month '${startTime}', '${endTime}', '${agentTeams}', '${isFindPDS}', '${isFindC2C}', '${campaigns}'
      `;
    }

    if (type == 'by-day') {
      _query = `
        USE ins1_recording exec report_outbound_total_call_by_day '${startTime}', '${endTime}', '${agentTeams}', '${isFindPDS}', '${isFindC2C}', '${campaigns}', '${dateStr}'
      `;
    }

    if (type == 'by-agent') {
      _query = `
        USE ins1_recording exec report_outbound_total_call_by_agent '${startTime}', '${endTime}', '${agentTeams}', '${isFindPDS}', '${isFindC2C}', '${campaigns}', '${dateStr}'
      `;
    }

    if (type == 'detail') {
      _query = `
        USE ins1_recording exec report_outbound_total_call_detail '${startTime}', '${endTime}', '${agentTeams}', '${isFindPDS}', '${isFindC2C}', '${campaigns}', '${dateStr}', '${agentId}'
      `;
    }

    console.info(`------- _query ------- reportOutboundDailyByAgent`);
    console.info(_query);
    console.info(`------- _query ------- reportOutboundDailyByAgent`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

// Báo cáo này được sử dụng trong dự án migrate PVI-HCM 
exports.getCallDetailWithCallIds = async (db, dbMssql, query) => {
  try {
    const { callIds } = query;

    let _query = `
      SELECT
        TCD_Table.PeripheralCallKey AS CallId,
        Agent_Table.PeripheralNumber AS AgentId,
        TCD_Table.PeripheralCallType,
        TCD_Table.Duration,
        TCD_Table.RingTime,
        TCD_Table.DelayTime,
        TCD_Table.HoldTime,
        TCD_Table.TalkTime,
        TCD_Table.DigitsDialed,
        TCD_Table.ANI,
        TCD_Table.DateTime
      FROM ${DB_HDS}.dbo.t_Termination_Call_Detail TCD_Table
      LEFT JOIN ${DB_AWDB}.dbo.t_Agent Agent_Table ON Agent_Table.SkillTargetID = TCD_Table.AgentSkillTargetID
      WHERE
        TCD_Table.PeripheralCallKey IN ( ${callIds} )
        AND TCD_Table.AgentSkillTargetID IS NOT NULL
    `;

    console.info(`------- _query ------- getCallDetailWithCallIds`);
    console.info(_query);
    console.info(`------- _query ------- getCallDetailWithCallIds`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

