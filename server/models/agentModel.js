const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

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
    let _query = `SELECT ${fieldAgent(nameTB, namePK)} FROM [${DB_AWDB}].[dbo].[t_Agent_Team_Member] ${nameTB}

    INNER join [${DB_AWDB}].[dbo].[t_Agent] ${namePK}
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
    let _query = '';

    if (idSkillGroup && idSkillGroup != '') {
      _query = `
        SELECT
          skillGroupTable.[PeripheralName] skillGroupName,
          agentTable.[SkillTargetID] agentSkillTargetId,
          agentTable.[PeripheralNumber] agentId,
          personTable.[FirstName] firstName,
          personTable.[LastName] lastName,
          personTable.[LoginName] loginName,
          agentTable.[EnterpriseName] AgentName,
          agentTeamTable.[AgentTeamID] agentTeamId,
          agentTeamTable.[EnterpriseName] agentTeamName
        FROM
          [${DB_AWDB}].[dbo].[t_Skill_Group] skillGroupTable
          LEFT JOIN [${DB_AWDB}].[dbo].[t_Skill_Group_Member] skillGroupMemberTable ON skillGroupMemberTable.[SkillGroupSkillTargetID] = skillGroupTable.[SkillTargetID]
          LEFT JOIN [${DB_AWDB}].[dbo].[t_Agent] agentTable ON agentTable.[SkillTargetID] = skillGroupMemberTable.[AgentSkillTargetID]
          LEFT JOIN [${DB_AWDB}].[dbo].[t_Person] personTable ON personTable.[PersonID] = agentTable.[PersonID]
          LEFT JOIN [${DB_AWDB}].[dbo].[t_Agent_Team] agentTeamTable ON agentTable.[AgentDeskSettingsID] = agentTeamTable.[AgentTeamID] 
        WHERE
          skillGroupTable.[PeripheralName] LIKE '%${prefix}%'
          AND skillGroupTable.[PeripheralNumber] IN (${idSkillGroup})
      `;
    } else {
      _query = `
        SELECT
          agentTable.[SkillTargetID] agentSkillTargetId,
          agentTable.[PeripheralNumber] agentId,
          agentTable.[EnterpriseName] agentName,
          personTable.[FirstName] firstName,
          personTable.[LastName] lastName,
          personTable.[LoginName] loginName
        FROM
          [${DB_AWDB}].[dbo].[t_Agent] agentTable
          LEFT JOIN [${DB_AWDB}].[dbo].[t_Person] personTable ON personTable.[PersonID] = agentTable.[PersonID]
      `;
    }


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

exports.agentTeam = async (db, dbMssql, query) => {
  try {
    let { prefix } = query;
    let _query = `SELECT * FROM [${DB_AWDB}].[dbo].[t_Agent_Team]

    where EnterpriseName LIKE '%${prefix}%'`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};