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
    let _query = `SELECT ${fieldAgent(nameTB, namePK)} FROM [${DB_HDS}].[dbo].[t_Agent_Team_Member] ${nameTB}

    INNER join [${DB_HDS}].[dbo].[t_Agent] ${namePK}
    on ${namePK}.SkillTargetID = ${nameTB}.SkillTargetID

    where ${nameTB}.AgentTeamID in (${Agent_Team})`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

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
    let _query = `SELECT * FROM [${DB_HDS}].[dbo].[t_Agent_Team]

    where EnterpriseName LIKE '%${prefix}%'`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};