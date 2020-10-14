const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
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
      and CallDisposition in (13, 6)
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