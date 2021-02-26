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
    let { startDate, endDate } = query;
    let _query = `
   SELECT 
    Time_Block_Table.[AgentID],
    Time_Block_Table.[AgentName], 
    Time_Block_Table.[SkillGroupID], 
    Time_Block_Table.[SkillGroupName], 
    Time_Block_Table.[TimeBlock], 
    COUNT(Time_Block_Table.[AgentID]) AS SOLAN FROM 
      (SELECT 
      Agent_Table.[SkillTargetID] AgentID
      ,Agent_Table.[EnterpriseName] AgentName
      ,Skill_Group_Table.[SkillTargetID] SkillGroupID
      ,Skill_Group_Table.[EnterpriseName] SkillGroupName
      ,DATEPART(hour,TCD_Table.[DateTime]) TimeBlock
      FROM
      [${DB_HDS}].[dbo].[t_Termination_Call_Detail] TCD_Table
      LEFT JOIN [lab_awdb].[dbo].[t_Agent] Agent_Table ON Agent_Table.[SkillTargetID] = TCD_Table.[AgentSkillTargetID]
      LEFT JOIN [lab_awdb].[dbo].[t_Skill_Group] Skill_Group_Table ON Skill_Group_Table.[SkillTargetID] = TCD_Table.[SkillGroupSkillTargetID] 
      WHERE (TCD_Table.[PeripheralCallType] = 9 OR TCD_Table.[PeripheralCallType] = 10) 
      AND TCD_Table.[DateTime] >= '${startDate}'
      AND TCD_Table.[DateTime] < '${endDate}'
      --and Skill_Group_Table.[EnterpriseName] = 'DemoSkillGroup1'
      ) Time_Block_Table
    GROUP BY 
    Time_Block_Table.[AgentID],
    Time_Block_Table.[AgentName], 
    Time_Block_Table.[SkillGroupID], 
    Time_Block_Table.[SkillGroupName], 
    Time_Block_Table.[TimeBlock]
    ORDER BY 
    Time_Block_Table.[AgentID]`

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * API lấy dữ liệu cuộc gọi nhỡ tổng hợp theo SkillGroup
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-30 00:00:00'
 *   , endDate: '2020-10-30 23:59:59'
 *   , callTypeID: '5014'
 *   , CT_Tranfer: '5015'
 *    }
 */

exports.reportOutboundOverallAgentProductivity = async (db, dbMssql, query) => {
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
    } = query;

  } catch (error) {
    throw new Error(error);
  }
};
