const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists, variableSQL, } = require("../helpers/functions");

exports.distinctTCD = async (db, dbMssql, query) => {
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

    let _query = `
    ${variableSQL(query)}
    Select * from  [${DB_AWDB}].[dbo].[t_Skill_Group] SG

    where SG.SkillTargetID in (
      Select DISTINCT SkillGroupSkillTargetID FROM [${DB_HDS}].[dbo].[t_Termination_Call_Detail]
      where 
      DateTime >= @startDate
      and DateTime < @endDate
      and CallTypeID in (@CT_IVR, @CT_ToAgentGroup1, @CT_ToAgentGroup2, @CT_ToAgentGroup3, @CT_Queue1, @CT_Queue2, @CT_Queue3)
      and SkillGroupSkillTargetID is not null
    )`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.byIds = async (db, dbMssql, query) => {
  try {
    let {
      ids
    } = query;
    
    let _query = `
    Select * FROM [${DB_AWDB}].[dbo].[t_Skill_Group]

    where SkillTargetID in (${ids})
    and Deleted = 'N'`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};
