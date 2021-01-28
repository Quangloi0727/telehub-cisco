const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

exports.getAll = async (db, dbMssql) => {
  try {
    let _query = `SELECT TOP (1000) [SkillTargetID]
                        ,[PersonID]
                        ,[AgentDeskSettingsID]
                        ,[ScheduleID]
                        ,[PeripheralID]
                        ,[EnterpriseName]
                        ,[PeripheralNumber]
                        ,[ConfigParam]
                        ,[Description]
                        ,[Deleted]
                        ,[PeripheralName]
                        ,[TemporaryAgent]
                        ,[AgentStateTrace]
                        ,[SupervisorAgent]
                        ,[ChangeStamp]
                        ,[UserDeletable]
                        ,[DefaultSkillGroup]
                        ,[DepartmentID]
                        ,[DateTimeStamp]
                    FROM t_Agent`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.agentMemberTeam = async (db, dbMssql, query) => {
  try {
    let { Agent_Team } = query;
    let [nameTB, namePK] = ['awdb_Agent_Team_Member', 'awdb_Agent']
    let _query = `SELECT ${fieldAgent(nameTB, namePK)} FROM [ins1_awdb].[dbo].[t_Agent_Team_Member] ${nameTB}

    INNER join [ins1_awdb].[dbo].[t_Agent] ${namePK}
    on ${namePK}.SkillTargetID = ${nameTB}.SkillTargetID

    where ${nameTB}.AgentTeamID in (${Agent_Team})`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.agentsByCompany = async (dbMssql, query) => {
  try {
    let { teamId } = query;
    let _query = `
      SELECT
        [ins1_awdb].[dbo].[t_Agent_Team].[AgentTeamID]
        ,[ins1_awdb].[dbo].[t_Agent_Team].[EnterpriseName] AgentTeamName
        ,[ins1_awdb].[dbo].[t_Agent].[SkillTargetID]
        ,[ins1_awdb].[dbo].[t_Agent].[EnterpriseName] AgentName
        ,[ins1_awdb].[dbo].[t_Agent].[PersonID]
        ,[ins1_awdb].[dbo].[t_Person].[FirstName]
        ,[ins1_awdb].[dbo].[t_Person].[LastName]
      FROM [ins1_awdb].[dbo].[t_Agent_Team]
      INNER JOIN [ins1_awdb].[dbo].[t_Agent] ON [ins1_awdb].[dbo].[t_Agent_Team].[PeripheralID] = [ins1_awdb].[dbo].[t_Agent].[PeripheralID]
      INNER JOIN [ins1_awdb].[dbo].[t_Person] ON [ins1_awdb].[dbo].[t_Agent].[PersonID] = [ins1_awdb].[dbo].[t_Person].[PersonID]
      WHERE [ins1_awdb].[dbo].[t_Agent_Team].[AgentTeamID] = ${teamId}
      `
    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
}

function fieldAgent(nameTB, namePK) {
  return `${nameTB}.[AgentTeamID]
  ,${nameTB}.[SkillTargetID]
  ,${namePK}.[PersonID]
  ,${namePK}.[AgentDeskSettingsID]
  ,${namePK}.[ScheduleID]
  ,${namePK}.[PeripheralID]
  ,${namePK}.[EnterpriseName]
  ,${namePK}.[PeripheralNumber]
  ,${namePK}.[ConfigParam]
  ,${namePK}.[Description]
  ,${namePK}.[Deleted]
  ,${namePK}.[PeripheralName]
  ,${namePK}.[TemporaryAgent]
  ,${namePK}.[AgentStateTrace]
  ,${namePK}.[SupervisorAgent]
  ,${namePK}.[ChangeStamp]
  ,${namePK}.[UserDeletable]
  ,${namePK}.[DefaultSkillGroup]
  ,${namePK}.[DepartmentID]
  ,${namePK}.[DateTimeStamp]`;
}
