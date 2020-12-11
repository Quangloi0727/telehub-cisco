const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists, variableSQL } = require("../helpers/functions");

/**
 * db:
 * dbMssql:
 * query:
 *   { startDate: '2020-10-13 00:00:00'
 *   , endDate: '2020-10-13 23:59:59'
 *   , callTypeID: '5014'
 *    }
 */

exports.agentTeam = async (db, dbMssql, query) => {
  try {
    let { Agent_Team } = query;

    let _query = `
    /****** Script for SelectTopNRows command from SSMS  ******/
     SELECT
     Agent_Team_Member.SkillTargetID,
     Agent.EnterpriseName,
     Agent_Real_Time.Extension,
     Agent_Real_Time.AgentState,
     AgentStateText = CASE Agent_Real_Time.AgentState  
                    WHEN 0 THEN 'Logged Out' 
                    WHEN 1 THEN 'Logged On' 
                    WHEN 2 THEN 'Not Ready' 
                    WHEN 3 THEN 'Ready' 
                    WHEN 4 THEN 'Talking' 
                    WHEN 5 THEN 'Work Not Ready' 
                    WHEN 6 THEN 'Work Ready' 
                    WHEN 7 THEN 'Busy Other' 
                    WHEN 8 THEN 'Reserved'  
                    WHEN 9 THEN 'Unknown' 
                    WHEN 10 THEN 'Hold' 
                    WHEN 11 THEN 'Active'  
                    WHEN 12 THEN 'Paused' 
                    WHEN 13 THEN 'Interrupted' 
                    WHEN 14 THEN 'Not Active' 
                    ELSE CONVERT(VARCHAR, Agent_Real_Time.AgentState) END
     ,Reason_Code.ReasonText
     ,ReasonTextTelehub = CASE
			WHEN Agent_Real_Time.AgentState = 3   THEN 'Ready'
			WHEN Agent_Real_Time.AgentState = 4   THEN 'Talking'
			WHEN Agent_Real_Time.AgentState = 2 and Reason_Code.ReasonText is NULL  THEN 'Not Ready'
			WHEN Agent_Real_Time.AgentState = 2 and Reason_Code.ReasonText is NOT NULL  THEN Reason_Code.ReasonText
			ELSE CONVERT(VARCHAR, Agent_Real_Time.AgentState) END
     ,Agent_Real_Time.DateTime
     ,LastStateChange = DATEDIFF(ss, Agent_Real_Time.DateTimeLastStateChange, CASE WHEN (DATEDIFF(ss, Agent_Real_Time.DateTimeLastStateChange, (SELECT NowTime from Controller_Time (nolock) )) < = 0 ) 
                              THEN Agent_Real_Time.DateTimeLastStateChange 
                              ELSE(SELECT NowTime FROM Controller_Time (nolock) ) END)
     ,AgentTeam = Agent_Team.EnterpriseName

     
     FROM [ins1_awdb].[dbo].[t_Agent_Team_Member] Agent_Team_Member

     INNER join [ins1_awdb].[dbo].[t_Agent] Agent
     on Agent.SkillTargetID = Agent_Team_Member.SkillTargetID
     
     INNER join [ins1_awdb].[dbo].[t_Agent_Real_Time] Agent_Real_Time
     on Agent_Real_Time.SkillTargetID =  Agent_Team_Member.SkillTargetID
     
     INNER join [ins1_awdb].[dbo].[t_Agent_Team] Agent_Team
     on Agent_Team.AgentTeamID =  Agent_Team_Member.AgentTeamID
     
     left join [ins1_awdb].[dbo].[t_Reason_Code] Reason_Code
     on Reason_Code.ReasonCode =  Agent_Real_Time.ReasonCode
     
     where Agent_Team.AgentTeamID in (${Agent_Team})
     order by Agent_Real_Time.AgentState, Agent_Team.AgentTeamID
     `;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};
