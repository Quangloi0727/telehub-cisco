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
    let { prefix, idSkillGroup } = query;

    let queryWithIdSkillGroup = '';
    if (idSkillGroup && idSkillGroup != '') {
      queryWithIdSkillGroup = `AND [ins1_awdb].[dbo].[t_Skill_Group].[SkillTargetID] = ${idSkillGroup}`
    }

    let _query = `
      SELECT
      [ins1_awdb].[dbo].[t_Agent].[SkillTargetID] agentId,
      [ins1_awdb].[dbo].[t_Agent].[PeripheralNumber] peripheralNumber,
      [ins1_awdb].[dbo].[t_Skill_Group].[PeripheralName] skillGroupName,
      [ins1_awdb].[dbo].[t_Person].[FirstName] firstName,
      [ins1_awdb].[dbo].[t_Person].[LastName] lastName,
      [ins1_awdb].[dbo].[t_Person].[LoginName] loginName,
      [ins1_awdb].[dbo].[t_Agent].[EnterpriseName] AgentName,
      [ins1_awdb].[dbo].[t_Agent_Team].[AgentTeamID] agentTeamId,
      [ins1_awdb].[dbo].[t_Agent_Team].[EnterpriseName] agentTeamName
    FROM
      [ins1_awdb].[dbo].[t_Skill_Group]
      LEFT JOIN [ins1_awdb].[dbo].[t_Skill_Group_Member] ON [ins1_awdb].[dbo].[t_Skill_Group].[SkillTargetID] = [ins1_awdb].[dbo].[t_Skill_Group_Member].[SkillGroupSkillTargetID]
      LEFT JOIN [ins1_awdb].[dbo].[t_Agent] ON [ins1_awdb].[dbo].[t_Skill_Group_Member].[AgentSkillTargetID] = [ins1_awdb].[dbo].[t_Agent].[SkillTargetID]
      LEFT JOIN [ins1_awdb].[dbo].[t_Person] ON [ins1_awdb].[dbo].[t_Agent].[PersonID] = [ins1_awdb].[dbo].[t_Person].[PersonID] 
      LEFT JOIN [ins1_awdb].[dbo].[t_Agent_Team] ON [ins1_awdb].[dbo].[t_Agent].[AgentDeskSettingsID] = [ins1_awdb].[dbo].[t_Agent_Team].[AgentTeamID] 
    WHERE
      [ins1_awdb].[dbo].[t_Skill_Group].[PeripheralName] LIKE '%${prefix}%'
      ${queryWithIdSkillGroup}
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
