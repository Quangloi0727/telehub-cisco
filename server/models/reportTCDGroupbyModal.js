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

exports.callDisposition = async (db, dbMssql, query) => {
  try {
    let {
      startDate,
      endDate,
      callTypeID,
      callTypeTranferID,
      callDisposition,
    } = query;
    let callTypeQuery = [callTypeID];

    let _query = `SELECT 
    CallDisposition
    ,Count(*) count
    ,Sum(case
      when CallDisposition = 13
      and Variable8 is not null
      and SkillGroupSkillTargetID is null
      and AgentSkillTargetID is null
      then 1
      else 0 end
    ) CallDisposition_13_not_agent
     FROM [ins1_awdb].[dbo].[Termination_Call_Detail]
     where
        DateTime >= '${startDate}'
        AND DateTime < '${endDate}'
        AND CallTypeID in (${callTypeQuery.join(",")})
        AND CallDisposition NOT IN (52)
        Group by CallDisposition`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};
