const ldapLib = require("../libs/ldap");
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

/**
 * 1. call api update password cisco: do ko có config của API cisco trên telehub-cisco nên chuyển việc này xuống CRM
 * 2. call method update password Active Directory (AD) by ldap
 * @param {*} db 
 * @param {*} dbMssql 
 * @param {*} query 
 * @returns 
 */
exports.resetPass = async (db, dbMssql, query, body) => {
  try {
    let { username, oldPass, newPass } = body;

    return await resetPassAD(username, oldPass, newPass);

  } catch (error) {
    throw new Error(error);
  }
};

/**
 * 
 * @param {*} params 
 */
async function resetPassAD(username, oldPass, newPass) {
  try {
    const client = await ldapLib.initConnect(_config.adServer.url);
    const agentEntry = await ldapLib.searchAgentByUsername(client, username, oldPass, _config.adServer.dc1, _config.adServer.dc2);
    const userDN = agentEntry.object.dn;
    
    const result = await ldapLib.changePassByDN(client, userDN, oldPass, newPass);

    return result;

  } catch (error) {

    // handle message  gửi về người dùng
    if(error.message && error.message.includes('AcceptSecurityContext')) {
      error.message = 'Tên đăng nhập hoặc mật khẩu không chính xác';
    }
    throw error;
  }
}
