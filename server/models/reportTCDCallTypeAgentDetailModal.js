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
 *    }
 */
exports.getAll = async (db, dbMssql, query) => {
  try {
    let { startDate, endDate, callTypeID } = query;
    let _query = `SELECT 
    [AgentSkillTargetID]
     ,SUM(ISNULL(TalkTime, 0)) SumsTalkTime
     ,SUM(ISNULL(HoldTime, 0)) SumsHoldTime
     ,SUM(ISNULL(Duration, 0)) SumsDuration
     ,COUNT(RecoveryKey) as connected
     ,Max(Duration) MaxsDuration -- cuoc goi dai nhat
     
     ,Min(Duration) MinsDuration -- cuoc goi ngan nhat
     ,SUM(CASE WHEN SkillGroupSkillTargetID is not null 
        and TalkTime > 0 THEN 1 ELSE 0 END) handled
   ,SUM(CASE WHEN 
        SkillGroupSkillTargetID is not null 
        THEN 1 
        ELSE 0 
        END
        ) inbound
   ,SUM(CASE WHEN 
        CallDisposition in (19, 3, 60)
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
        AND CallTypeID in (${callTypeID})
        AND AgentSkillTargetID is not null -- cần đếm theo cuộc gọi nhỡ, ... thì dùng thêm dữ liệu agent ID null
        group by AgentSkillTargetID
        ORDER BY AgentSkillTargetID, DateTime
    `;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};