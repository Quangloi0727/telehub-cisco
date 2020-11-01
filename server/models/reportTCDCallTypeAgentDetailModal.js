const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT, TYPE_MISSCALL } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");
/**
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-13 00:00:00'
 *   , endDate: '2020-10-13 23:59:59'
 *   , callTypeID: '5014'
 *   , callTypeTranferID: '5015'
 *    }
 */

exports.getAll = async (db, dbMssql, query) => {
  try {
    let { startDate, endDate, callTypeID, callTypeTranferID } = query;
    let callTypeQuery = [callTypeID];
    let queryTranfer = "";

    if (callTypeTranferID) {
      callTypeQuery.push(callTypeTranferID);
      queryTranfer = `SUM(CASE WHEN 
	     SkillGroupSkillTargetID is not null 
          and CallTypeID = ${callTypeTranferID}
          and CallDisposition in (13)
          THEN 1 ELSE 0 END) tranferIn
	,`;
    }

    let _query = `SELECT 
     [AgentSkillTargetID]
     ,SUM(ISNULL(TalkTime, 0)) SumsTalkTime
     ,SUM(ISNULL(HoldTime, 0)) SumsHoldTime
     ,SUM(ISNULL(Duration, 0)) SumsDuration
     ,COUNT(RecoveryKey) as connected
     ,Max(Duration) MaxsDuration -- cuoc goi dai nhat
     ,Min(Duration) MinsDuration -- cuoc goi ngan nhat
     ,SUM(CASE WHEN 
		SkillGroupSkillTargetID is not null 
		and CallTypeID = ${callTypeID}
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

     FROM [ins1_awdb].[dbo].[Termination_Call_Detail]
          --INNER JOIN Agent
          --ON Agent.SkillTargetID = Termination_Call_Detail.AgentSkillTargetID
     where
        DateTime >= '${startDate}'
        AND DateTime < '${endDate}'
        AND CallTypeID in (${callTypeQuery.join(",")})
        AND AgentSkillTargetID is not null -- cần đếm theo cuộc gọi nhỡ, ... thì dùng thêm dữ liệu agent ID null
        group by AgentSkillTargetID
        ORDER BY AgentSkillTargetID, DateTime`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.getByHourBlock = async (db, dbMssql, query) => {
  try {
    let { startDate, endDate, callTypeID, callTypeTranferID } = query;
    let callTypeQuery = [callTypeID];
    let queryTranfer = "";

    if (callTypeTranferID) {
      callTypeQuery.push(callTypeTranferID);
    }

    let _query = `SELECT
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
    FROM [ins1_awdb].[dbo].[Termination_Call_Detail]
      where 
      DateTime >= '${startDate}'
      AND DateTime < '${endDate}'
      AND CallTypeID in (${callTypeQuery.join(",")})
      and CallDisposition in (13, 6) -- 13: cuộc gọi inbound, 6: cuộc gọi tranfer
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
//      FROM [ins1_awdb].[dbo].[Termination_Call_Detail]
//      where
//           DateTime >= '${startDate}'
//           AND DateTime < '${endDate}'
//           AND CallTypeID in (${callTypeQuery.join(",")})
//           and CallDisposition in (13, 6)
// 		AND SkillGroupSkillTargetID is not null
// 		AND AgentSkillTargetID is not null -- cần đếm theo cuộc gọi nhỡ, ... thì dùng thêm dữ liệu agent ID null
// 		AND TalkTime > 0
//           group by AgentSkillTargetID
//           ,DATEPART(HOUR, CallTypeReportingDateTime)
// 		,DATEPART(Day, CallTypeReportingDateTime)
// 		,DATEPART(MONTH, CallTypeReportingDateTime)
// 		,DATEPART(YEAR, CallTypeReportingDateTime)
//      `

/**
 * Paging:
 *    0: query chi tiết dữ liệu theo trang
 *    1: query tổng dữ liệu để phân trang
 */

exports.getDetailAgent = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      callTypeID,
      callTypeTranferID,
      pages,
      rows,
      paging,
      duration_g,
      wait_g,
      download,
    } = query;
    let callTypeQuery = [callTypeID];
    let querySelect = "";
    let queryCondition = "";
    if (callTypeTranferID) {
      callTypeQuery.push(callTypeTranferID);
    }

    if (paging == 1) {
      querySelect = `count(*) count`;

      if (duration_g) {
        duration_g.forEach((item) => {
          querySelect += createChartConditions(item, "TalkTime");
        });
      }

      if (wait_g) {
        wait_g.forEach((item) => {
          querySelect += createChartConditions(item, "TalkTime");
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
        from [ins1_awdb].[dbo].[Termination_Call_Detail] as TCDExtend
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

    let _query = `SELECT
      ${querySelect}
      FROM [ins1_awdb].[dbo].[Termination_Call_Detail] TCD
      where 
        DateTime >= '${startDate}'
        AND DateTime < '${endDate}'
        AND CallTypeID in (${callTypeQuery.join(",")})
        and CallDisposition in (13, 6) -- 13: cuộc gọi inbound, 6: cuộc gọi tranfer
        AND SkillGroupSkillTargetID is not null
        AND AgentSkillTargetID is not null -- sau nay 
        AND TalkTime > 0
        ${queryCondition}
    `;
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
    let {
      startDate,
      endDate,
      callTypeID,
      callTypeTranferID,
      callDisposition,
    } = query;
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
     FROM [ins1_awdb].[dbo].[Termination_Call_Detail]
          --INNER JOIN Agent
          --ON Agent.SkillTargetID = Termination_Call_Detail.AgentSkillTargetID
     where
        DateTime >= '${startDate}'
        AND DateTime < '${endDate}'
        AND CallTypeID in (${callTypeQuery.join(",")})
        --and CallDisposition in (13, 6) -- 13: cuộc gọi inbound, 6: cuộc gọi tranfer
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
 * API lấy dữ liệu chi tiết cuộc gọi nhỡ
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , callTypeTranferID: '5015'
 *    }
 */

exports.missCall = async (db, dbMssql, query) => {
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
    } = query;
    let querySelect = "";
    let queryCondition = "";

    if (paging == 1) {
      querySelect = `count(*) count`;
    } else {
      querySelect = `
    [RecoveryKey]
      ,case 
        when 
          CallTypeID = @CT_IVR
          and CallDisposition	= 13
          then '${reasonToTelehub(TYPE_MISSCALL.MissIVR)}'
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
        when 
          CallTypeID in (@CT_Queue1, @CT_Queue2, @CT_Queue3)
          and CallDisposition	in (13)
          AND AgentSkillTargetID is null
          then '${reasonToTelehub(TYPE_MISSCALL.MissQueue)}'
        else '${reasonToTelehub(TYPE_MISSCALL.Other)}'
        end MissReason
         ,[CallTypeID]
       ,[DNIS]
      ,[RouterCallKeySequenceNumber] RCKSequenceNumber
          ,[AgentSkillTargetID]
          ,[SkillGroupSkillTargetID]
        ,[ServiceSkillTargetID]
          ,[PeripheralID]
          ,[RouteID]
          ,[RouterCallKeyDay]
          ,[RouterCallKey]
        ,[CallDisposition]
          ,[DateTime]
          ,[RingTime]
        ,[TalkTime]
          ,[Duration]
          ,[DelayTime]
          ,[TimeToAband]
          ,[HoldTime]
          ,[WorkTime]
          ,[LocalQTime]
          ,[BillRate]
          ,[CallSegmentTime]
          ,[ConferenceTime]
          ,[Variable1]
          ,[Variable2]
          ,[Variable3]
          ,[Variable4]
          ,[Variable5]
         ,[PeripheralCallType]
          ,[DigitsDialed]
          ,[PeripheralCallKey]
          ,[NetworkTime]
          ,[UserToUser]
          ,[NewTransaction]
          ,[RecoveryDay]
          ,[TimeZone]
          ,[NetworkTargetID]
          ,[TrunkGroupID]
       ,[MRDomainID]
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
          ,[CED]
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
          ,[StartDateTimeUTC]
          ,[ProtocolID]
          ,[PrecisionQueueID]
          ,[PrecisionQueueStepOrder]
          ,[Attributes]`;

      if (download === 0) {
        queryCondition = `Order By RouterCallKey, RouterCallKeySequenceNumber
        OFFSET ${(pages - 1) * rows} ROWS FETCH NEXT ${rows} ROWS ONLY`;
      }
    }

    let _query = `/**
    Mô tả:
    - Start: 01/11/2020
    - Detail: chi tiết dữ liệu cuộc gọi nhỡ theo, hiện tại chạy đúng theo từng ngày, chạy theo nhiều ngày thì phải test thêm
    - đã test chạy được theo query nhiều ngày
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
  
  -- Định nghĩa CallType cho các chặng cuộc gọi có trong hệ thống
  set @CT_IVR = ${CT_IVR}; -- Mã toAgent của skill group 1
  set @CT_ToAgentGroup1 = ${
    CT_ToAgentGroup1 || null
  }; -- Mã toAgent của skill group 1
  set @CT_ToAgentGroup2 = ${
    CT_ToAgentGroup2 || null
  }; -- Mã toAgent của skill group 2
  set @CT_ToAgentGroup3 = ${
    CT_ToAgentGroup3 || null
  }; -- Mã toAgent của skill group 3
  set @CT_Queue1 = ${CT_Queue1 || null}; -- Mã queue của skill group 1
  set @CT_Queue2 = ${CT_Queue2 || null}; -- Mã queue của skill group 2
  set @CT_Queue3 = ${CT_Queue3 || null}; -- Mã queue của skill group 3
  
  -- Ngày bắt đầu query
  set @startDate = '${startDate}';
  -- Ngày kết thúc query
  set @endDate = '${endDate}';
  
  Select 
    ${querySelect}
   FROM [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD
   where DateTime >= @startDate
    and DateTime < @endDate
    and CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
    and RecoveryKey not in (
      
      Select RecoveryKey FROM [ins1_hds].[dbo].[t_Termination_Call_Detail] t_TCD_handle
        where  DateTime >= @startDate
            and DateTime < @endDate
            and (
              -- loại các cuộc handle
              AgentSkillTargetID is not null
              and t_TCD_handle.CallTypeID in (@CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
              and TalkTime > 0
              And CallDisposition in (13)
              
              or (
                -- loại các bản tin đầu tiên: 
                t_TCD.RouterCallKeySequenceNumber in (0)
              )
              or (
                -- loại các bản tin thứ 2 nhưng callType ko là IVR: tức là đã vào queue hoặc vào agent 
                t_TCD.RouterCallKeySequenceNumber in (1)
                and t_TCD_handle.CallTypeID not in (@CT_IVR)
              )
              or (
                -- loại các bản tin thứ 2 nhưng callType ko là IVR: tức là đã vào queue hoặc vào agent 
                t_TCD_handle.RouterCallKeySequenceNumber = 3 
                and t_TCD_handle.CallTypeID not in (@CT_ToAgentGroup1, @CT_ToAgentGroup2,@CT_ToAgentGroup3)
                and t_TCD_handle.AgentSkillTargetID is null
                and t_TCD_handle.CallDisposition in (13)
              )
              or (
                -- loại các bản tin thứ 2 nhưng callType ko là IVR: tức là đã vào queue hoặc vào agent 
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

/**
 * Format lý do trả về cho telehub:
 * "MissIVR-1"
 * @param {Object} infoReason
 */
function reasonToTelehub(infoReason) {
  return [infoReason.id, infoReason.value].join("-");
}
