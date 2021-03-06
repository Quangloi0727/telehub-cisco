const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const { FIELD_AGENT, TYPE_MISSCALL, CALL_DISPOSITION } = require("../helpers/constants");
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
 */

exports.getAll = async (db, dbMssql, query) => {
  try {
    let { startDate, endDate, callTypeID, CT_Tranfer } = query;
    // let callTypeQuery = [callTypeID];
    let queryTranfer = "";
    let CT_ToAgent_Dynamic = [];
    let CT_Queue_Dynamic = [];

    if (CT_Tranfer) {
      // callTypeQuery.push(CT_Tranfer);
      queryTranfer = `SUM(CASE WHEN 
	     SkillGroupSkillTargetID is not null 
          and CallTypeID = @CT_Tranfer
          and CallDisposition in (13)
          THEN 1 ELSE 0 END) tranferIn
	,`;
    }

    Object.keys(query).forEach(item => {
      const element = query[item];
      if(
        item.includes("CT_ToAgentGroup")
      ){
        CT_ToAgent_Dynamic.push(`@${item}`);
      }
      
      if(
        item.includes("CT_Queue")
      ){
        CT_Queue_Dynamic.push(`@${item}`);
      }

    });

    let _query = `
    ${variableSQLDynamic(query)}
    SELECT 
     [AgentSkillTargetID]
     ,SUM(ISNULL(TalkTime, 0)) SumsTalkTime
     ,SUM(ISNULL(HoldTime, 0)) SumsHoldTime
     ,SUM(ISNULL(Duration, 0)) SumsDuration
     ,COUNT(RecoveryKey) as connected
     ,Max(Duration) MaxsDuration -- cuoc goi dai nhat
     ,Min(Duration) MinsDuration -- cuoc goi ngan nhat
     ,SUM(CASE WHEN 
		SkillGroupSkillTargetID is not null 
		and CallTypeID in (${[...CT_ToAgent_Dynamic,...CT_Queue_Dynamic].join(",")})
		THEN 1 
		ELSE 0 
		END
		) inbound
	,SUM(CASE WHEN 
	  SkillGroupSkillTargetID is not null 
		and TalkTime > 0 
		and CallDisposition in (13, 6)
		THEN 1 ELSE 0 END) handled
	,${queryTranfer}
     SUM(CASE WHEN 
		CallDisposition in (19, 3, 60, 7)
		THEN 1 
		ELSE 0 
		END
		) missed
    ,Max(DateTime) DateTime -- cuoc goi dai nhat
    ,Max(AgentPeripheralNumber) AgentPeripheralNumber -- cuoc goi dai nhat

    FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail]
        --INNER JOIN Agent
        --ON Agent.SkillTargetID = Termination_Call_Detail.AgentSkillTargetID
    WHERE DateTime >= @startDate
    and DateTime < @endDate
    AND CallTypeID in (${[...CT_ToAgent_Dynamic,...CT_Queue_Dynamic].join(",")}, @CT_Tranfer)
    AND AgentSkillTargetID is not null -- c???n ?????m theo cu???c g???i nh???, ... th?? d??ng th??m d??? li???u agent ID null
    group by AgentSkillTargetID
    ORDER BY AgentSkillTargetID, DateTime`;

    _logger.log('info', `getAll ${_query}`);
    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.getByHourBlock = async (db, dbMssql, query) => {
  try {
    let CT_ToAgent_Dynamic = [];
    let CT_Queue_Dynamic = [];

    Object.keys(query).forEach(item => {
      const element = query[item];
      if(
        item.includes("CT_ToAgentGroup")
      ){
        CT_ToAgent_Dynamic.push(`@${item}`);
      }
      
      if(
        item.includes("CT_Queue")
      ){
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
      AND CallTypeID in (${[...CT_ToAgent_Dynamic,...CT_Queue_Dynamic].join(",")})
      and CallDisposition in (13, 6) -- 13: cu???c g???i inbound, 6: cu???c g???i tranfer
      AND SkillGroupSkillTargetID is not null
      AND AgentSkillTargetID is not null -- sau nay 
      AND TalkTime > 0
  `;
    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

// group
// `
//      SELECT
//           AgentSkillTargetID
//           ,count(DATEPART(HOUR, CallTypeReportingDateTime)) HandleHourBlock
//           ,DATEPART(HOUR, CallTypeReportingDateTime) HourBlock
//           ,DATEPART(DAY, CallTypeReportingDateTime) DayBlock
//           ,DATEPART(MONTH, CallTypeReportingDateTime) MonthBlock
//           ,DATEPART(YEAR, CallTypeReportingDateTime) YearBlock
//           ,MAX(AgentPeripheralNumber) AgentPeripheralNumber
//      FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail]
//      where
//           DateTime >= '${startDate}'
//           AND DateTime < '${endDate}'
//           AND CallTypeID in (${callTypeQuery.join(",")})
//           and CallDisposition in (13, 6)
// 		AND SkillGroupSkillTargetID is not null
// 		AND AgentSkillTargetID is not null -- c???n ?????m theo cu???c g???i nh???, ... th?? d??ng th??m d??? li???u agent ID null
// 		AND TalkTime > 0
//           group by AgentSkillTargetID
//           ,DATEPART(HOUR, CallTypeReportingDateTime)
// 		,DATEPART(Day, CallTypeReportingDateTime)
// 		,DATEPART(MONTH, CallTypeReportingDateTime)
// 		,DATEPART(YEAR, CallTypeReportingDateTime)
//      `

/**
 * Paging:
 *    0: query chi ti???t d??? li???u theo trang
 *    1: query t???ng d??? li???u ????? ph??n trang
 */

exports.getDetailAgent = async (db, dbMssql, query) => {
  try {
    let { pages, rows, paging, duration_g, wait_g, download } = query;

    let querySelect = "";
    let queryCondition = "";

    if (paging == 1) {
      querySelect = `count(*) count`;

      if (duration_g) {
        duration_g.forEach((item) => {
          querySelect += createChartConditions(item, "TalkTime");
        });
      }

      if (wait_g) {
        wait_g.forEach((item) => {
          querySelect += createChartConditions(item, "Duration - TCD.TalkTime");
        });
      }
    } else {
      querySelect = `[RecoveryKey]
          --,[MRDomainID]
          ,[AgentSkillTargetID]
          ,[SkillGroupSkillTargetID]
          ,[ServiceSkillTargetID]
          ,[PeripheralID]
          ,[RouteID]
          ,[RouterCallKeyDay]
          ,[RouterCallKey]
        ,(
        select 
        MIN(TCDExtend.StartDateTimeUTC)
        from [${DB_AWDB}].[dbo].[Termination_Call_Detail] as TCDExtend
        where TCDExtend.RouterCallKey = TCD.RouterCallKey
        and TCDExtend.RouterCallKeyDay = TCD.RouterCallKeyDay
        )as FirstTimeCall
        ,[StartDateTimeUTC]
          ,[DateTime]
          ,[PeripheralCallType]
          ,[DigitsDialed]
          ,[PeripheralCallKey]
          ,[CallDisposition]
          ,[NetworkTime]
          ,[Duration]
          ,[RingTime]
          ,[DelayTime]
          ,[TimeToAband]
          ,[HoldTime]
          ,[TalkTime]
          ,[WorkTime]
          --,[LocalQTime]
          --,[BillRate]
          --,[CallSegmentTime]
          --,[ConferenceTime]
          ,[Variable1]
          ,[Variable2]
          ,[Variable3]
          ,[Variable4]
          ,[Variable5]
          ,[UserToUser]
          ,[NewTransaction]
          ,[RecoveryDay]
          ,[TimeZone]
          ,[NetworkTargetID]
          ,[TrunkGroupID]
          ,[DNIS]
          ,[InstrumentPortNumber]
          ,[AgentPeripheralNumber]
          ,[ICRCallKey]
          ,[ICRCallKeyParent]
          ,[ICRCallKeyChild]
          ,[Variable6]
          ,[Variable7]
          ,[Variable8]
          ,[Variable9]
          ,[Variable10]
          ,[ANI]
          ,[AnsweredWithinServiceLevel]
          ,[Priority]
          ,[Trunk]
          ,[WrapupData]
          ,[SourceAgentPeripheralNumber]
          ,[SourceAgentSkillTargetID]
          ,[CallDispositionFlag]
          ,[RouterCallKeySequenceNumber]
          ,[CED]
          ,[CallTypeID]
          ,[BadCallTag]
          ,[ApplicationTaskDisposition]
          ,[ApplicationData]
          ,[NetQTime]
          ,[DbDateTime]
          ,[ECCPayloadID]
          ,[CallTypeReportingDateTime]
          ,[RoutedSkillGroupSkillTargetID]
          ,[RoutedServiceSkillTargetID]
          ,[RoutedAgentSkillTargetID]
          ,[Originated]
          ,[CallReferenceID]
          ,[CallGUID]
          ,[LocationParamPKID]
          ,[LocationParamName]
          ,[PstnTrunkGroupID]
          ,[PstnTrunkGroupChannelNumber]
          ,[NetworkSkillGroupQTime]
          ,[EnterpriseQueueTime]
          ,[ProtocolID]
          ,[PrecisionQueueID]
          ,[PrecisionQueueStepOrder]
          ,[Attributes]`;

      if (download === 0) {
        queryCondition = `ORDER BY DateTime DESC
        OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY`;
      }
    }

    let CT_ToAgent_Dynamic = [];
    let CT_Queue_Dynamic = [];

    Object.keys(query).forEach(item => {
      const element = query[item];
      if(
        item.includes("CT_ToAgentGroup")
      ){
        CT_ToAgent_Dynamic.push(`@${item}`);
      }
      
      if(
        item.includes("CT_Queue")
      ){
        CT_Queue_Dynamic.push(`@${item}`);
      }

    });


    let _query = `
    ${variableSQLDynamic(query)}
    SELECT
      ${querySelect}
      FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail] TCD 
      WHERE DateTime >= @startDate
      and DateTime < @endDate
        AND CallTypeID in (${[...CT_ToAgent_Dynamic,...CT_Queue_Dynamic].join(",")},@CT_Tranfer)
        --and CallDisposition in (${CALL_DISPOSITION.handle.join(',')}) -- 13: cu???c g???i inbound, 6: cu???c g???i tranfer
        and CallDisposition in (13,28) -- b??? cu???c g???i tranfer v?? ch??? l???y cu???c g???i cu???i c??ng
        AND SkillGroupSkillTargetID is not null
        AND AgentSkillTargetID is not null -- sau nay 
        AND TalkTime > 0
        ${queryCondition}
    `;

    _logger.log('info', `getDetailAgent ${_query}`);
    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

function createChartConditions(item, field) {
  var arr = item.split("_");
  let _query = "";

  if (arr[1] == "lt") {
    _query = `,${arr[0]}_lt_${arr[2]}=sum(CASE  
                  WHEN TCD.${field} < ${arr[2]} THEN 1 
                  ELSE 0 
                END) `;
  } else if (arr[1] == "gt") {
    _query = `,${arr[0]}_gt_${arr[2]}=sum(CASE  
                  WHEN TCD.${field} > ${arr[2]} THEN 1 
                  ELSE 0 
                END) `;
  } else {
    _query = `,${arr[0]}_${arr[1]}_${arr[2]}=sum(CASE  
                when TCD.${field} < ${arr[2]}
                and TCD.${field} >= ${arr[1]} THEN 1 
                ELSE 0 
              END) `;
  }

  return _query;
}

exports.getGroupByCallDisposition = async (db, dbMssql, query) => {
  try {
    let { startDate, endDate, callTypeID, CT_Tranfer, callDisposition } = query;
    let callTypeQuery = [callTypeID];
    let queryCallDisposition = "";

    queryCallDisposition = callDisposition
      .map((i) => {
        return `,Sum(case CallDisposition when ${i} then 1 else 0 end) CallDisposition_${i}`;
      })
      .join("");

    let _query = `SELECT 
     [AgentSkillTargetID]
     ,Max(AgentPeripheralNumber) AgentPeripheralNumber
     ,Count(*) total
	   ${queryCallDisposition}
     FROM [${DB_AWDB}].[dbo].[Termination_Call_Detail]
          --INNER JOIN Agent
          --ON Agent.SkillTargetID = Termination_Call_Detail.AgentSkillTargetID
     where
        DateTime >= '${startDate}'
        AND DateTime < '${endDate}'
        AND CallTypeID in (${callTypeQuery.join(",")})
        --and CallDisposition in (13, 6) -- 13: cu???c g???i inbound, 6: cu???c g???i tranfer
        AND SkillGroupSkillTargetID is not null
        AND AgentSkillTargetID is not null -- sau nay 
        AND CallDisposition in (19, 3, 60, 7)
        --and CallDisposition not in (13)
            --AND TalkTime = 0
        Group by AgentSkillTargetID`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * API l???y d??? li???u chi ti???t cu???c g???i nh???
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.missCall = async (db, dbMssql, query) => {
  try {
    let { pages, rows, paging, download, rawData, skillGroups } = query;
    let querySelect = "";
    let queryCondition = "";

    querySelect = `${selectMissIVR(query)}
        UNION
        ${selectMissQueue(query)}
        UNION
        ${selectMissAgent(query)}`;

    if (download === 0 && paging == 0) {
      queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber
        OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY`;
    }
    if (rawData === true)
      queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber`;

    let _query = `/**
    M?? t???:
    - Start: 01/11/2020
    - Detail: chi ti???t d??? li???u cu???c g???i nh??? theo, hi???n t???i ch???y ????ng theo t???ng ng??y, ch???y theo nhi???u ng??y th?? ph???i test th??m
    - ???? test ch???y ???????c theo query nhi???u ng??y
  */
  
  ${variableSQL(query)}
  
WITH t_TCD_last AS (
  SELECT  ROW_NUMBER() OVER (PARTITION BY RouterCallKeyDay, RouterCallKey ORDER BY RouterCallKeySequenceNumber DESC, RecoveryKey DESC) AS rn
  ,*
  FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] as m
  where DateTime >= @startDate
	and DateTime < @endDate
	and CallTypeID in (@CT_IVR, @CT_Queue1, @CT_Queue2, @CT_Queue3)
	-- and AgentSkillTargetID is null

	-- and CT_Tranfer =  '5015'
	--ORDER by  RouterCallKey DESC
	--GROUP by RouterCallKey
)
    ${querySelect}
    ${queryCondition}`;

    let resultQuery = await dbMssql.query(_query);

    if (resultQuery) {
      if (paging == 1) {
        resultQuery.recordset = [{ count: resultQuery.recordset.length }];
        querySelect = resultQuery;
      } else {
        resultQuery = resultQuery;
      }
    }
    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * API l???y d??? li???u chi ti???t cu???c g???i nh???
 * Trang telehub: B??O C??O G???I V??O - CU???C G???I B??? NH??? THEO KH??CH H??NG: T??m ki???m t???ng qu??t
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.missCallByCustomer = async (db, dbMssql, query) => {
  try {
    let { pages, rows, paging, download, rawData, skillGroups } = query;
    let querySelect = "";
    let queryCondition = "";
    let CT_Dynamic = [];

    querySelect = `${selectMissByCustomer(query)}`;
    if (download === 0 && paging == 0) {
      queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber
      OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY`;
    }
    if (rawData === true)
      queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber`;

    Object.keys(query).forEach((item) => {
      const element = query[item];
      if (item.includes("CT")) {
        CT_Dynamic.push(element);
      }
    });

    let _query = `/**
      M?? t???:
        - Start: 01/11/2020
        - Detail: chi ti???t d??? li???u cu???c g???i nh??? theo, hi???n t???i ch???y ????ng theo t???ng ng??y, ch???y theo nhi???u ng??y th?? ph???i test th??m
        - ???? test ch???y ???????c theo query nhi???u ng??y
      */
    
      ${variableSQLDynamic(query)}
      
      WITH t_TCD_last AS (
        SELECT  ROW_NUMBER() OVER (PARTITION BY  RouterCallKeyDay, RouterCallKey ORDER BY RouterCallKeySequenceNumber DESC, RecoveryKey DESC) AS rn
        ,*
        FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] as m
        where DateTime >= @startDate
        AND DateTime < @endDate
        AND CallTypeID in (${CT_Dynamic.join(",")})
      )
      ${querySelect}
      ${queryCondition}`;

    let resultQuery = await dbMssql.query(_query);

    _logger.log("info", `missCallByCustomer ${_query}`);

    if (resultQuery) {
      if (paging == 1) {
        resultQuery.recordset = [{ count: resultQuery.recordset.length }];
        querySelect = resultQuery;
      } else {
        resultQuery = resultQuery;
      }
    }
    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * API l???y d??? li???u chi ti???t cu???c g???i nh???
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.missCallOld = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      CT_IVR,
      CT_ToAgentGroup1,
      CT_ToAgentGroup2,
      CT_ToAgentGroup3,
      CT_Queue1,
      CT_Queue2,
      CT_Queue3,
      pages,
      rows,
      paging,
      download,
      rawData,
    } = query;
    let querySelect = "";
    let queryCondition = "";

    if (paging == 1) {
      querySelect = `count(*) count`;
    } else {
      querySelect = ``;

      if (download === 0) {
        queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber
        OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY`;
      }
      if (rawData === true)
        queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber`;
    }

    let _query = `/**
    M?? t???:
    - Start: 01/11/2020
    - Detail: chi ti???t d??? li???u cu???c g???i nh??? theo, hi???n t???i ch???y ????ng theo t???ng ng??y, ch???y theo nhi???u ng??y th?? ph???i test th??m
    - ???? test ch???y ???????c theo query nhi???u ng??y
  */
  
  DECLARE @CT_IVR varchar(100);
  DECLARE @CT_ToAgentGroup1 varchar(100);
  DECLARE @CT_ToAgentGroup2 varchar(100);
  DECLARE @CT_ToAgentGroup3 varchar(100);
  DECLARE @CT_Queue1 varchar(100);
  DECLARE @CT_Queue2 varchar(100);
  DECLARE @CT_Queue3 varchar(100);
  
  DECLARE @startDate varchar(100);
  DECLARE @endDate varchar(100);
  
  -- ?????nh ngh??a CallType cho c??c ch???ng cu???c g???i c?? trong h??? th???ng
  set @CT_IVR = ${CT_IVR}; -- M?? toAgent c???a skill group 1
  set @CT_ToAgentGroup1 = ${
    CT_ToAgentGroup1 || null
  }; -- M?? toAgent c???a skill group 1
  set @CT_ToAgentGroup2 = ${
    CT_ToAgentGroup2 || null
  }; -- M?? toAgent c???a skill group 2
  set @CT_ToAgentGroup3 = ${
    CT_ToAgentGroup3 || null
  }; -- M?? toAgent c???a skill group 3
  set @CT_Queue1 = ${CT_Queue1 || null}; -- M?? queue c???a skill group 1
  set @CT_Queue2 = ${CT_Queue2 || null}; -- M?? queue c???a skill group 2
  set @CT_Queue3 = ${CT_Queue3 || null}; -- M?? queue c???a skill group 3
  
  -- Ng??y b???t ?????u query
  set @startDate = '${startDate}';
  -- Ng??y k???t th??c query
  set @endDate = '${endDate}';
  
  Select 
    ${querySelect}
   FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] t_TCD
   left join [${DB_AWDB}].[dbo].[t_Skill_Group] SG
   on t_TCD.SkillGroupSkillTargetID = SG.SkillTargetID
   where DateTime >= @startDate
    and DateTime < @endDate
    and CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
    and RecoveryKey not in (
      
      Select RecoveryKey FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] t_TCD_handle
        where  DateTime >= @startDate
            and DateTime < @endDate
            and (
              -- lo???i c??c cu???c handle
              AgentSkillTargetID is not null
              and t_TCD_handle.CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
              and TalkTime > 0
              And CallDisposition in (13)
              
              or (
                -- lo???i c??c b???n tin ?????u ti??n: 
                t_TCD.RouterCallKeySequenceNumber in (0)
              )
              or (
                -- lo???i c??c b???n tin th??? 2 nh??ng callType ko l?? IVR: t???c l?? ???? v??o queue ho???c v??o agent 
                t_TCD.RouterCallKeySequenceNumber in (1)
                and t_TCD_handle.CallTypeID not in (@CT_IVR)
              )
              or (
                -- lo???i c??c b???n tin th??? 2 nh??ng callType ko l?? IVR: t???c l?? ???? v??o queue ho???c v??o agent 
                t_TCD_handle.RouterCallKeySequenceNumber = 3 
                and t_TCD_handle.CallTypeID not in (@CT_ToAgentGroup1, @CT_ToAgentGroup2,@CT_ToAgentGroup3)
                and t_TCD_handle.AgentSkillTargetID is null
                and t_TCD_handle.CallDisposition in (13)
              )
              or (
                -- lo???i c??c b???n tin th??? 2 nh??ng callType ko l?? IVR: t???c l?? ???? v??o queue ho???c v??o agent 
                t_TCD_handle.RouterCallKeySequenceNumber in (4,5) 
                and t_TCD_handle.CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2,@CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
                and t_TCD_handle.AgentSkillTargetID is null
                and t_TCD_handle.CallDisposition in (13)
              )
            )
    )
    --and RouterCallKeySequenceNumber = 4
    ${queryCondition}`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

function selectMissByCustomer(query) {
  let { skillGroups } = query;
  // CT-5016
  let conditionFilter = ``;
  let CT_ToAgent_Dynamic = [];
  let CT_Queue_Dynamic = [];
  let JOIN_Dynamic = [];

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
      conditionFilter = `and CallTypeID in (@CT_IVR, ${CallTypeIDFilter})`;
    } else if (filterIVR.length > 0) {
      conditionFilter = `and CallTypeID in (@CT_IVR)
                         AND AgentSkillTargetID is null`;
    } else if (filterSG.length > 0) {
      conditionFilter = `
      And (CallTypeID in (${CallTypeIDFilter})
        and SkillGroupSkillTargetID in (${filterSG})
        or (
          CallTypeID in (${CallTypeIDFilter})
          and SkillGroupSkillTargetID is null 
        )
      )`;
    }
  }

  Object.keys(query).forEach((item) => {
    const element = query[item];
    if (item.includes("CT_ToAgentGroup")) {
      CT_ToAgent_Dynamic.push(element);
    }

    if (item.includes("CT_Queue")) {
      CT_Queue_Dynamic.push(element);
    }

    if (item.includes("SG_Voice_")) {
      let groupNumber = item.replace("SG_Voice_", "");
      // console.log({groupNumber});

      JOIN_Dynamic.push(`
        or(t_TCD_last.SkillGroupSkillTargetID is null
        and t_TCD_last.CallTypeID in (@CT_ToAgentGroup${groupNumber}, @CT_Queue${groupNumber}) and SG.SkillTargetID = @SG_Voice_${groupNumber})
        `);
    }
  });

  return `SELECT
      case 
        when 
          CallTypeID = @CT_IVR
          and CallDisposition	= 13
          then '${reasonToTelehub(TYPE_MISSCALL.MissIVR)}'
        when 
          CallTypeID in (${CT_Queue_Dynamic.join(",")})
          and CallDisposition	in (13)
          AND AgentSkillTargetID is null
          then '${reasonToTelehub(TYPE_MISSCALL.MissQueue)}'
        when 
          CallTypeID in (${CT_ToAgent_Dynamic.join(",")})
          and CallDisposition	in (3)
          then '${reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)}'
        when 
        CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(
          ","
        )})
          and CallDisposition	in (19)
          then '${reasonToTelehub(TYPE_MISSCALL.MissAgent)}'
        when 
          CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(
            ","
          )})
          and CallDisposition	in (60)
          then '${reasonToTelehub(TYPE_MISSCALL.RejectByAgent)}'
        when 
          CallTypeID in (${[...CT_ToAgent_Dynamic, ...CT_Queue_Dynamic].join(
            ","
          )})
          AND AgentSkillTargetID is not null
          AND TalkTime >= 0
          AND CallDisposition	in (6,7)
          then '${reasonToTelehub(TYPE_MISSCALL.MissShortCall)}'
        
      else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
      end MissReason
      ,case 
        when 
          CallTypeID = @CT_IVR
          and CallDisposition	= 13
          then 'IVR'
      else 'QUEUE'
      end CT_Type
      ${fieldMissCallTCD(query)}
  FROM t_TCD_last 
  left join [${DB_AWDB}].[dbo].[t_Skill_Group] SG
    on t_TCD_last.SkillGroupSkillTargetID = SG.SkillTargetID
      ${JOIN_Dynamic.join("")}
  WHERE rn = 1

    ${conditionFilter}
    AND t_TCD_last.RecoveryKey not in ( --b??? nh???ng cu???c g???i l?? handle
      Select RecoveryKey from [${DB_HDS}].[dbo].[t_Termination_Call_Detail] TCD
        where TCD.DateTime >= @startDate
              AND TCD.DateTime < @endDate
              AND TCD.CallTypeID in (${[
                ...CT_ToAgent_Dynamic,
                ...CT_Queue_Dynamic,
              ].join(",")})
              AND TCD.CallDisposition in (13, 28)
              AND TCD.AgentSkillTargetID is not null
              AND TCD.TalkTime > 0
      )`;
}

function selectMissIVR(query) {
  let conditionFilter = ``;
  // if(skillGroups){
  //   let filterIVR = skillGroups.filter(i => i.includes("CT"));

  //   if(filterIVR.length > 0) {

  //   }
  //   let filterSG = skillGroups.filter(i => !i.includes("CT"));

  //   if(filterSG.length > 0) {

  //   }
  // }
  return `SELECT
    case 
      when 
        CallTypeID = @CT_IVR
        and CallDisposition	= 13
        then '${reasonToTelehub(TYPE_MISSCALL.MissIVR)}'
      else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
      end MissReason
    ,case 
      when 
        CallTypeID = @CT_IVR
        and CallDisposition	= 13
        then 'IVR'
    else 'QUEUE'
    end CT_Type
    ${fieldMissCallTCD(query)}
FROM t_TCD_last 
left join [${DB_AWDB}].[dbo].[t_Skill_Group] SG
on t_TCD_last.SkillGroupSkillTargetID = SG.SkillTargetID
    WHERE rn = 1
    and AgentSkillTargetID is null
    and CallTypeID in (@CT_IVR)`;
}

function selectMissQueue(query) {
  let conditionFilter = ``;

  // if(skillGroups){
  //   let filterIVR = skillGroups.filter(i => i.includes("CT"));

  //   if(filterIVR.length > 0) {

  //   }
  //   let filterSG = skillGroups.filter(i => !i.includes("CT"));

  //   if(filterSG.length > 0) {

  //   }
  // }
  return `SELECT
  case 
    when 
      CallTypeID in (@CT_Queue1, @CT_Queue2, @CT_Queue3)
      and CallDisposition	in (13)
      AND AgentSkillTargetID is null
      then '${reasonToTelehub(TYPE_MISSCALL.MissQueue)}'
    else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
    end MissReason
    ,case 
      when 
        CallTypeID = @CT_IVR
        and CallDisposition	= 13
        then 'IVR'
    else 'QUEUE'
    end CT_Type
    ${fieldMissCallTCD(query)}
    FROM t_TCD_last 
    left join [${DB_AWDB}].[dbo].[t_Skill_Group] SG
    on t_TCD_last.SkillGroupSkillTargetID = SG.SkillTargetID
  WHERE rn = 1
  and AgentSkillTargetID is null
  and CallTypeID in (@CT_Queue1, @CT_Queue2, @CT_Queue3)`;
}

function selectMissAgent(query) {
  let conditionFilter = ``;

  // if(skillGroups){
  //   let filterSG = skillGroups.filter(i => !i.includes("CT"));
  //   if(filterSG.length > 0) {
  //     conditionFilter = `AND SkillGroupSkillTargetID IN (${filterSG}) `
  //   }
  return `SELECT
  case 
      when 
        CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3)
        and CallDisposition	in (3)
        then '${reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)}'
      when 
        CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
        and CallDisposition	in (19)
        then '${reasonToTelehub(TYPE_MISSCALL.MissAgent)}'
      when 
        CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
        and CallDisposition	in (60)
        then '${reasonToTelehub(TYPE_MISSCALL.RejectByAgent)}'
    else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
    end MissReason
    ,case 
      when 
        CallTypeID = @CT_IVR
        and CallDisposition	= 13
        then 'IVR'
    else 'QUEUE'
    end CT_Type
    ${fieldMissCallTCD(query)}
   FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail] t_TCD
   left join [${DB_AWDB}].[dbo].[t_Skill_Group] SG
    on t_TCD.SkillGroupSkillTargetID = SG.SkillTargetID
   WHERE DateTime >= @startDate
      and DateTime < @endDate
    and AgentSkillTargetID is not null
     and CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
     and CallDisposition in (60, 3, 19)`;
}

function fieldMissCallTCD(query) {
  let when_dynamic = [];

  for (let i = 0; i < Object.keys(query).length; i++) {
    const item = Object.keys(query)[i];
    // let element = query[item];
    if (item.includes("SG_Voice_")) {
      let groupNumber = item.replace("SG_Voice_", "");
      // console.log({groupNumber});

      when_dynamic.push(`
      when SkillGroupSkillTargetID is null
			and CallTypeID in (@CT_ToAgentGroup${groupNumber}, @CT_Queue${groupNumber})
      then @SG_Voice_${groupNumber}
      `);
    }
  }

  return `
  ,RecoveryKey
  ,RouterCallKeySequenceNumber
  ,CallTypeID
  ,RouterCallKey
  ,AgentSkillTargetID
  ,[DateTime]
  ,[RingTime]
  ,[TalkTime]
  ,[Duration]
  ,[DelayTime]
  ,[TimeToAband]
  ,[HoldTime]
  ,[WorkTime]
  ,CallDisposition
  ,ANI
  ,TimeZone
  ,StartDateTimeUTC
  ,SG.EnterpriseName EnterpriseName
  ,case
    ${when_dynamic.join("")}
		else SkillGroupSkillTargetID
	end SkillGroupSkillTargetID`;
}
