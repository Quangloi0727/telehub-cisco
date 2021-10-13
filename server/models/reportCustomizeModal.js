const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const {
  FIELD_AGENT,
  TYPE_MISSCALL,
  TYPE_CALL_HANDLE,
  REASON_CODE,
} = require("../helpers/constants");
const {
  checkKeyValueExists,
  reasonToTelehub,
  variableSQL,
  variableSQLDynamic,
} = require("../helpers/functions");

/**
 * API lấy dữ liệu chi tiết cuộc gọi nhỡ
 * Trang telehub:
 *  - BÁO CÁO GỌI VÀO - báo cáo 20 80
 *  - BÁO CÁO GỌI VÀO - báo cáo theo queue
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.agentStatusByTime = agentStatusByTime;

exports.lastTCDRecord = async (db, dbMssql, query) => {
  try {
    let querySelect = "";
    let queryCondition = "";
    let CT_Dynamic = [];
    const nameTableTCDLast = `t_TCD_last`;
    const nameTableTCDDetail = `TCD_Detail`; // để lấy thông tin của bản tin TCD

    querySelect = `${selectCallDetailByCustomer(
      query,
      nameTableTCDLast,
      nameTableTCDDetail
    )}`;
    queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber`;
    Object.keys(query).forEach((item) => {
      const element = query[item];
      if (item.includes("CT")) {
        CT_Dynamic.push(`@${item}`);
      }
    });

    let _query = `/**
      Mô tả:
        - Start: 01/11/2020
        - Detail: chi tiết dữ liệu cuộc gọi nhỡ theo, hiện tại chạy đúng theo từng ngày, chạy theo nhiều ngày thì phải test thêm
        - đã test chạy được theo query nhiều ngày
        
        Log 1: 20/11/2020 cần tính thêm nên thay đổi.
      */
    
      ${variableSQLDynamic(query)}
      
      WITH ${nameTableTCDLast} AS (
        SELECT ROW_NUMBER() OVER (PARTITION BY  RouterCallKeyDay, RouterCallKey ORDER BY RouterCallKeySequenceNumber DESC, RecoveryKey DESC) AS rn
        ,*
        FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] as m
        where DateTime >= @startDate
        AND DateTime < @endDate
        AND CallTypeID in (${CT_Dynamic.join(",")})
      )
      ${querySelect}
      ${queryCondition}`;

    _logger.log("info", `lastTCDRecord ${_query}`);
    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * *** Mô tả comment *********************************
 * *** Ngày: 2020-12-12
 * *** Dev: hainv
 * *** Lý do:
 * Do thêm field waitTimeQueue nên cần join dòng có RouterCallKeySequenceNumber = 1
 * trong các bản tin TCD trả về để lấy thông tin thời gian chờ phục vụ cho báo cáo mới của kplus
 * Nhưng do dùng LEFT JOIN sẽ bị trùng 1 số kết quả (duplicated dòng miss IVR) nên số liệu báo cáo bị sai
 * *** Cách khắc phục duplicated:
 * Không dùng LEFT JOIN mà dùng OUTER APPLY, chi tiết xem trong function fieldCallTCD
 * Reference: https://stackoverflow.com/questions/22769641/left-join-without-duplicate-rows-from-left-table
 *
 * *** Mô tả comment *********************************
 * *** Ngày comment: 2020-12-12
 * *** Dev comment: hainv
 * *** Lý do comment:
 * ...
 * *** Cách khắc phục duplicated:
 * ...
 *
 * @param {object} query
 * @param {string} nameTable
 * @param {string} nameTCDDetail
 */
function selectCallDetailByCustomer(query, nameTable, nameTCDDetail) {
  let { skillGroups, startDateFilter, endDateFilter } = query;
  // CT-5016
  let conditionFilter = ``;
  let CT_ToAgent_Dynamic = [];
  let CT_Queue_Dynamic = [];
  let JOIN_Dynamic = [];

  if (startDateFilter && endDateFilter) {
    conditionFilter = `AND ${nameTable}.DateTime >= '${startDateFilter}'
    AND ${nameTable}.DateTime <= '${endDateFilter}'`;
  }

  if (skillGroups) {
    skillGroups = skillGroups.split(",");
    let filterIVR = skillGroups.filter((i) => i.includes("CT"));
    let filterSG = skillGroups.filter((i) => !i.includes("CT"));
    let CallTypeIDFilter = [];

    filterSG.forEach((item) => {
      let SG_FOUND = Object.keys(query).find((i) => query[i] === item);
      if (SG_FOUND) {
        let groupNumber = SG_FOUND.replace("SG_Voice_", "");
        CallTypeIDFilter = [
          ...CallTypeIDFilter,
          query[`CT_ToAgentGroup${groupNumber}`],
          query[`CT_Queue${groupNumber}`],
        ];
      }
    });

    if (filterIVR.length > 0 && filterSG.length > 0) {
      conditionFilter += `and ${nameTable}.CallTypeID in (@CT_IVR, ${CallTypeIDFilter})`;
    } else if (filterIVR.length > 0) {
      conditionFilter += `and ${nameTable}.CallTypeID in (@CT_IVR)
                         AND ${nameTable}.AgentSkillTargetID is null`;
    } else if (filterSG.length > 0) {
      conditionFilter += `
      And (${nameTable}.CallTypeID in (${CallTypeIDFilter})
        and ${nameTable}.SkillGroupSkillTargetID in (${filterSG})
        or (
          ${nameTable}.CallTypeID in (${CallTypeIDFilter})
          and ${nameTable}.SkillGroupSkillTargetID is null 
        )
      )`;
    }
  }

  Object.keys(query).forEach((item) => {
    const element = query[item];
    if (item.includes("CT_ToAgentGroup")) {
      CT_ToAgent_Dynamic.push(`@${item}`);
    }

    if (item.includes("CT_Queue")) {
      CT_Queue_Dynamic.push(`@${item}`);
    }

    if (item.includes("SG_Voice_")) {
      let groupNumber = item.replace("SG_Voice_", "");
      // console.log({groupNumber});

      JOIN_Dynamic.push(`
        or(${nameTable}.SkillGroupSkillTargetID is null
        and ${nameTable}.CallTypeID in (@CT_ToAgentGroup${groupNumber}, @CT_Queue${groupNumber}) and SG.SkillTargetID = @SG_Voice_${groupNumber})
        `);
    }
  });

  return `SELECT
      case 
        when 
          ${nameTable}.CallTypeID = @CT_IVR
          and ${nameTable}.CallDisposition	= 13
          then '${reasonToTelehub(TYPE_MISSCALL.MissIVR)}'
        when 
          ${nameTable}.CallTypeID in (${CT_Queue_Dynamic.join(",")})
          and ${nameTable}.CallDisposition	in (13)
          AND ${nameTable}.AgentSkillTargetID is null
          then '${reasonToTelehub(TYPE_MISSCALL.MissQueue)}'
        when 
          ${nameTable}.CallTypeID in (${CT_ToAgent_Dynamic.join(",")})
          and ${nameTable}.CallDisposition	in (3)
          then '${reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)}'
        when 
          ${nameTable}.CallTypeID in (${[
    ...CT_ToAgent_Dynamic,
    ...CT_Queue_Dynamic,
  ].join(",")})
          and ${nameTable}.CallDisposition	in (19)
          then '${reasonToTelehub(TYPE_MISSCALL.MissAgent)}'
        when 
          ${nameTable}.CallTypeID in (${[
    ...CT_ToAgent_Dynamic,
    ...CT_Queue_Dynamic,
  ].join(",")})
          and ${nameTable}.CallDisposition	in (60)
          then '${reasonToTelehub(TYPE_MISSCALL.RejectByAgent)}'
        when 
          ${nameTable}.CallTypeID in (${[
    ...CT_ToAgent_Dynamic,
    ...CT_Queue_Dynamic,
  ].join(",")})
          AND ${nameTable}.AgentSkillTargetID is not null
          AND ${nameTable}.TalkTime > 0
          AND ${nameTable}.CallDisposition	in (13, 28)
          then '${reasonToTelehub(TYPE_CALL_HANDLE)}'
        when 
          ${nameTable}.CallTypeID in (${[
    ...CT_ToAgent_Dynamic,
    ...CT_Queue_Dynamic,
  ].join(",")})
          AND ${nameTable}.AgentSkillTargetID is not null
          AND ${nameTable}.TalkTime >= 0
          AND ${nameTable}.CallDisposition	in (6,7)
          then '${reasonToTelehub(TYPE_MISSCALL.MissShortCall)}'
        
      else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
      end CallTypeTXT
      ${fieldCallTCD(query, nameTable, nameTCDDetail)}
  FROM ${nameTable}
  OUTER APPLY
  (
    SELECT TOP 1 *
    FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] ${nameTCDDetail}
    WHERE ${nameTCDDetail}.RouterCallKey =  ${nameTable}.RouterCallKey
   and ${nameTCDDetail}.RouterCallKeyDay =  ${nameTable}.RouterCallKeyDay
   and (
     ${nameTCDDetail}.RouterCallKeySequenceNumber = 1
     -- and  ${nameTable}.RouterCallKeySequenceNumber NOT IN (1)
     -- or(
     --	${nameTCDDetail}.RouterCallKeySequenceNumber = 0
     --	and  ${nameTable}.RouterCallKeySequenceNumber IN (1)
     -- )
   )
  ) ${nameTCDDetail}

  left join [${DB_AWDB}].[dbo].[t_Skill_Group] SG
    on ${nameTable}.SkillGroupSkillTargetID = SG.SkillTargetID
      ${JOIN_Dynamic.join("")}
  WHERE rn = 1
    ${conditionFilter}
    `;
}

/**
 *
 * @param {String} query tham số truyền từ req.query
 * @param {String} nameTable tên table TCD_last
 * @param {String} nameTCDDetail tên table TCD_Detail: để lấy thông tin bản tin TCD thỏa mãn RouterCallKeySequenceNumber = 1
 */

function fieldCallTCD(
  query,
  nameTable = `t_TCD_last`,
  nameTCDDetail = `TCD_Detail`
) {
  let whenDynamic = [];
  let CT_QUEUE_Dynamic = [];
  let CT_ToAgent_Dynamic = [];

  Object.keys(query).forEach((item) => {
    const element = query[item];

    if (item.includes("SG_Voice_")) {
      let groupNumber = item.replace("SG_Voice_", "");

      whenDynamic.push(`
          when ${nameTable}.SkillGroupSkillTargetID is null
            and ${nameTable}.CallTypeID in (@CT_ToAgentGroup${groupNumber}, @CT_Queue${groupNumber})
          then @SG_Voice_${groupNumber}
        `);
    }

    if (item.includes("CT_Queue")) {
      CT_QUEUE_Dynamic.push(`@${item}`);
    }
    if (item.includes("CT_ToAgentGroup")) {
      CT_ToAgent_Dynamic.push(`@${item}`);
    }
  });

  return `
  ,${nameTable}.RecoveryKey
  ,${nameTable}.DigitsDialed
  ,${nameTable}.RouterCallKeySequenceNumber
  ,${nameTable}.CallTypeID
  ,${nameTable}.RouterCallKey
  ,${nameTable}.AgentSkillTargetID
  ,${nameTable}.AgentPeripheralNumber
  ,${nameTable}.[DateTime]
  --,case 
  --  when 
  --    ${nameTable}.CallTypeID in (${CT_QUEUE_Dynamic.join(",")})
  --    and ${nameTable}.CallDisposition	in (13)
  --    AND ${nameTable}.AgentSkillTargetID is null
  --    then DATEDIFF(SECOND, TRY_CONVERT(datetime, FORMAT(${nameTCDDetail}.DateTime, 'yyyy-MM') + '-' + ${nameTCDDetail}.Variable4, 102), ${nameTable}.DateTime)
	--else DATEDIFF(SECOND, ${nameTCDDetail}.DateTime, ${nameTable}.DateTime)
  --end waitTimeQueue
  --,ABS(DATEDIFF(SECOND, DATEADD(SS, -t_TCD_last.Duration, t_TCD_last.DateTime),
    ,ABS(DATEDIFF(SECOND, 
  case 
  when t_TCD_last.RouterCallKeySequenceNumber = 1
  then t_TCD_last.DateTime
  else DATEADD(SS, -t_TCD_last.Duration, t_TCD_last.DateTime)
  end
  ,TRY_CONVERT(
		datetime,
		FORMAT(TCD_Detail.DateTime, 'yyyy-MM') + '-' + t_TCD_last.Variable4,
		102
	  )
	)) waitTimeQueue
  ,case 
    when 
      t_TCD_last.CallTypeID in (${[
        ...CT_ToAgent_Dynamic,
        ...CT_QUEUE_Dynamic,
      ].join(",")})
          AND t_TCD_last.AgentSkillTargetID is not null
          AND t_TCD_last.TalkTime >= 0
          AND t_TCD_last.CallDisposition	in (13)
      then t_TCD_last.Duration - t_TCD_last.TalkTime
	else null
  end waitTimeAnwser
  ,${nameTable}.[RingTime]
  ,${nameTable}.[TalkTime]
  ,${nameTable}.[Duration]
  ,${nameTable}.[DelayTime]
  ,${nameTable}.[TimeToAband]
  ,${nameTable}.[HoldTime]
  ,${nameTable}.[WorkTime]
  ,${nameTable}.CallDisposition
  ,${nameTable}.ANI
  ,${nameTable}.TimeZone
  ,${nameTable}.StartDateTimeUTC
  ,case
    -- query check call là cuộc handle
    when ${nameTable}.CallTypeID in (${[
    ...CT_ToAgent_Dynamic,
    ...CT_QUEUE_Dynamic,
  ].join(",")})
          AND ${nameTable}.AgentSkillTargetID is not null
          AND ${nameTable}.TalkTime >= 0
          AND ${nameTable}.CallDisposition	in (13)
          then ${nameTable}.TalkTime + ${nameTable}.HoldTime
		else 0
	end TotalDuarationHandling
  ,SG.EnterpriseName EnterpriseName
  ,${nameTable}.CallTypeReportingDateTime
  ,DATEPART(MINUTE, ${nameTable}.CallTypeReportingDateTime) MinuteBlock
  ,DATEPART(HOUR, ${nameTable}.CallTypeReportingDateTime) HourBlock
  ,DATEPART(DAY, ${nameTable}.CallTypeReportingDateTime) DayBlock
  ,DATEPART(MONTH, ${nameTable}.CallTypeReportingDateTime) MonthBlock
  ,DATEPART(YEAR, ${nameTable}.CallTypeReportingDateTime) YearBlock
  ,FORMAT(${nameTable}.CallTypeReportingDateTime, 'yyyy-MM-dd-HH') TimeBlock
  ,FORMAT(${nameTable}.CallTypeReportingDateTime, 'dd/MM') DayMonthBlock
  ,FORMAT(DATEADD(ss, -${nameTable}.Duration, ${nameTable}.DateTime), 'yyyy-MM-dd HH:mm') MinuteTimeBlock
  ,FORMAT(${nameTable}.CallTypeReportingDateTime, 'HH:mm') + '-' + FORMAT(DATEADD(mi,15,${nameTable}.CallTypeReportingDateTime), 'HH:mm') HourMinuteBlock
  ,case
		${whenDynamic.join("")}
		else ${nameTable}.SkillGroupSkillTargetID
	end SkillGroupSkillTargetID`;
}

async function agentStatusByTime(db, dbMssql, query) {
  try {
    let { status } = query;

    let querySelect = "";
    let queryCondition = "";
    let CT_Dynamic = [];
    const nameTB = `hds_Agent_Event_Detail`;
    const nameTBInterval = `hds_Agent_Interval`;

    if (["Ready", "Not Ready"].includes(status))
      querySelect = queryAgentInterVal(query, nameTBInterval);
    else querySelect = queryAgentStatusDetail(query, nameTB);

    let _query = `/**
      Mô tả:
        - Start: 14/01/2021
        - Detail: chi tiết dữ liệu cuộc gọi nhỡ theo, hiện tại chạy đúng theo từng ngày, chạy theo nhiều ngày thì phải test thêm
        - đã test chạy được theo query nhiều ngày
        
        Log 1: xx/xx/xxxx cần tính thêm nên thay đổi.
      */
    
      ${variableSQLDynamic(query)}
      ${querySelect}`;

    _logger.log("info", `agentStatusByTime ${_query}`);
    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
}

function queryAgentInterVal(query, nameTB) {
  let { Agent_Team, status, agentId } = query;

  let filterAgent = "";

  if (agentId && agentId.length > 0) {
    filterAgent = `AND ${nameTB}.[Extension] in (${agentId.join(",")})`;
  }

  return `SELECT 
  [DateTime]
  ,FORMAT(
    DATEADD(MINUTE, 0, ${nameTB}.DateTime)
    ,'HH:mm')+'-'+FORMAT(
      DATEADD(MINUTE, 15, ${nameTB}.DateTime)
      ,'HH:mm') BlockTimeShort
  ,${nameTB}.[SkillTargetID]
  ,[t_Agent].[EnterpriseName]
  ,${nameTB}.[Extension]
  ,[AvailTime]
  ,[NotReadyTime]

  FROM [${DB_HDS}].[dbo].[t_Agent_Interval] ${nameTB}
  INNER JOIN [${DB_AWDB}].[dbo].[t_Agent]
  on t_Agent.SkillTargetID = ${nameTB}.SkillTargetID


  where ${nameTB}.MRDomainID = 1 -- voice = 1, định nghĩa trong bản media gì gì đó
  AND ${nameTB}.DateTime >= @startDate
  AND ${nameTB}.DateTime < @endDate
  AND ${nameTB}.SkillTargetID in (
    select SkillTargetID FROM [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Where AgentTeamID = ${Agent_Team}
  )
  ${filterAgent}
  --AND ${nameTB}.SkillTargetID = 5225

  ORDER by ${nameTB}.DateTime`;
}

function queryAgentStatusDetail(query, nameTB) {
  let { Agent_Team, agentId } = query;
  let namePK = `t_Agent`;
  let filterAgent = "";

  if (agentId && agentId.length > 0) {
    filterAgent = `AND ${namePK}.[PeripheralNumber] in (${agentId.join(",")})`;
  }

  return `SELECT 
    case 
      ${genConditionBlockTime(nameTB, 15)}
      ${genConditionBlockTime(nameTB, 30)}
      ${genConditionBlockTime(nameTB, 45)}
      ${genConditionBlockTime(nameTB, 59)}
 
    else ${genConditionBlockTime(nameTB, 0)}
    end BlockTime,
    case 
      ${genConditionBlockTime(nameTB, 15, 15, "HH:mm", true)}
      ${genConditionBlockTime(nameTB, 30, 15, "HH:mm", true)}
      ${genConditionBlockTime(nameTB, 45, 15, "HH:mm", true)}
      ${genConditionBlockTime(nameTB, 59, 15, "HH:mm", true)}
 
    else ${genConditionBlockTime(nameTB, 0, 15, "HH:mm", true)}
    end BlockTimeShort
    ,[DateTime]
    ,${nameTB}.[SkillTargetID]
    ,[t_Agent].[EnterpriseName]
    ,${nameTB}.[MRDomainID]
    --,${nameTB}.[TimeZone]
    ,[LoginDateTime]
    ,[Event]
    ,${nameTB}.[RecoveryKey]
    ,${nameTB}.[ReasonCode]
    ,case 
        when awdb_Reason_Code.[ReasonText] is null
        then
          ${genReasonCodeGlobal(nameTB)}
      else awdb_Reason_Code.[ReasonText]
      end ReasonTextMapping
    ,(awdb_Reason_Code.[ReasonText]) ReasonText
    ,([Duration])
    --,[DbDateTime]

  FROM [${DB_HDS}].[dbo].[t_Agent_Event_Detail] ${nameTB}
  LEFT JOIN [${DB_AWDB}].[dbo].[t_Reason_Code] awdb_Reason_Code
  ON awdb_Reason_Code.ReasonCode = ${nameTB}.ReasonCode
  INNER JOIN [${DB_AWDB}].[dbo].[t_Agent] ${namePK}
  on ${namePK}.SkillTargetID = ${nameTB}.SkillTargetID


  where ${nameTB}.MRDomainID = 1 -- voice = 1, định nghĩa trong bản media gì gì đó
  AND ${nameTB}.DateTime >= @startDate
  AND ${nameTB}.DateTime < @endDate
  AND ${nameTB}.SkillTargetID in (
    select SkillTargetID FROM [${DB_AWDB}].[dbo].[t_Agent_Team_Member] Where AgentTeamID = ${Agent_Team}
  )
  ${filterAgent}
  --AND ${nameTB}.SkillTargetID = 5225

  ORDER by ${nameTB}.DateTime`;
}

/**
 *
 * @param {*} nameTB
 * @param {*} startBlock 15 30 45 59
 * @param {*} block
 */
function genConditionBlockTime(
  nameTB,
  startBlock = 15,
  block = 15,
  strFormat = "yyyy-MM-dd HH:mm:ss",
  endBlockTime = false
) {
  if (startBlock == 0) {
    return `${genFormatByBlockTime(
      startBlock - block,
      nameTB,
      strFormat,
      endBlockTime
    )}`;
  }

  if (startBlock == 59) {
    return `when 
            DATEPART(MINUTE, ${nameTB}.DateTime) <= ${startBlock} AND DATEPART(MINUTE, ${nameTB}.DateTime) > ${
      startBlock + 1 - block
    }
            then ${genFormatByBlockTime(
              startBlock + 1 - block,
              nameTB,
              strFormat,
              endBlockTime
            )}`;
  }

  return `when 
          DATEPART(MINUTE, ${nameTB}.DateTime) <= ${startBlock} AND DATEPART(MINUTE, ${nameTB}.DateTime) > ${
    startBlock - block
  }
          then ${genFormatByBlockTime(
            startBlock - block,
            nameTB,
            strFormat,
            endBlockTime
          )}`;
}

/**
 *
 * @param {*} fromTime
 * @param {*} nameTB
 */
function genFormatByBlockTime(
  fromTime = 15,
  nameTB,
  strFormat = "yyyy-MM-dd HH:mm:ss",
  endBlockTime = false
) {
  if (endBlockTime)
    return `FORMAT(
    DATEADD(SECOND, ${fromTime}*60 - (DATEPART(MINUTE, ${nameTB}.DateTime) * 60 + DATEPART(SECOND, ${nameTB}.DateTime)), ${nameTB}.DateTime)
    ,'${strFormat}')+'-'+FORMAT(
      DATEADD(SECOND, ${
        fromTime + 15
      }*60 - (DATEPART(MINUTE, ${nameTB}.DateTime) * 60 + DATEPART(SECOND, ${nameTB}.DateTime)), ${nameTB}.DateTime)
      ,'${strFormat}')`;
  return `FORMAT(
    DATEADD(SECOND, ${fromTime}*60 - (DATEPART(MINUTE, ${nameTB}.DateTime) * 60 + DATEPART(SECOND, ${nameTB}.DateTime)), ${nameTB}.DateTime)
    ,'${strFormat}')`;
}

/**
 *
 * @param {*} fromTime
 * @param {*} nameTB
 */
function genReasonCodeGlobal(nameTB) {
  let conditionReasonCode = REASON_CODE.map((i, index) => {
    return `when
          ${nameTB}.[ReasonCode] = ${i.rc}
          then '${i.rl}'`;
  }).join("");

  return `case 
          ${conditionReasonCode}
        else 'REASON_CODE not found'
        end`;
}

/**
 * Tai lieu procedure:
 *
 * Ping Team Lead tao procedure (neu chua co)
 * Nhận mã procedure từ Team Lead
 * Viết procedure: query, tạo bảng tạm, ...
 * exec procedure: chạy procedure
 */

exports.reportIncomingCallTrendsV2 = async (db, dbMssql, query) => {
  try {
    // skillGroups = 5179,CT-5020

    let {
      pages,
      rows,
      queue,
      startDate,
      endDate,
      CT_IVR,
      CT_Tranfer,
      DigitsDialed,
      skillGroups,
      startDateFilter,
      endDateFilter,
    } = query;
    // let {  } = callType;
    let _query = "";
    let g_CallType = []; // group CallType
    let g_SkillGroup = []; // group SkillGroup

    Object.keys(query).forEach((item) => {
      if (item.includes("SG_Voice_")) {
        let groupNumber = item.replace("SG_Voice_", "");
        g_CallType.push(
          `${query[`CT_ToAgentGroup${groupNumber}`]},${
            query[`CT_Queue${groupNumber}`]
          }`
        );
        g_SkillGroup.push(`${query[item]}`);
      }
    });
    let CallTypeIDFilter = [];

    if (skillGroups) {
      skillGroups = skillGroups.split(",");
      let filterIVR = skillGroups.filter((i) => i.includes("CT"));
      let filterSG = skillGroups.filter((i) => !i.includes("CT"));

      filterSG.forEach((item) => {
        let SG_FOUND = Object.keys(query).find((i) => query[i] === item);
        if (SG_FOUND) {
          let groupNumber = SG_FOUND.replace("SG_Voice_", "");
          CallTypeIDFilter = [
            ...CallTypeIDFilter,
            query[`CT_ToAgentGroup${groupNumber}`],
            query[`CT_Queue${groupNumber}`],
          ];
        }
      });

    }

    _query = `
    USE ins1_recording
    DECLARE @p_startTime  varchar(2000) = '${startDate}';
    DECLARE @p_endTime  varchar(2000) =  '${endDate}';
    DECLARE @p_CT_IVR varchar(2000) = '${CT_IVR || "#"}';
    DECLARE @p_CT_Tranfer varchar(2000)  = '${CT_Tranfer || "#"}';
    DECLARE @p_CT varchar(2000) = '${g_CallType.join(
      ";"
    )}'; -- 'CT_ToAgentGroup1,CT_Queue1;CT_ToAgentGroup2,CT_Queue2...'
    DECLARE @p_SG varchar(2000) = '${g_SkillGroup.join(",")}';
    DECLARE @p_SG varchar(2000) = '${g_SkillGroup.join(",")}';
    DECLARE @p_CT_Filter varchar(2000) = '${CallTypeIDFilter.length == 0 ? '#' : CallTypeIDFilter .join(",") }';

    exec report_inbound_ICT @p_startTime, @p_endTime, @p_CT_IVR, @p_CT_Tranfer, @p_CT, @p_SG, @p_CT_Filter
    `;

    _logger.log("info", `reportIncomingCallTrendsV2 ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};
