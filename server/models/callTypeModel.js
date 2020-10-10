const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

exports.getAll = async (db, dbMssql) => {
  try {
    let _query = `SELECT TOP (1000) [CallTypeID]
    ,[CustomerDefinitionID]
    ,[EnterpriseName]
    ,[Description]
    ,[ServiceLevelThreshold]
    ,[ServiceLevelType]
    ,[Deleted]
    ,[BucketIntervalID]
    ,[ChangeStamp]
    ,[DepartmentID]
    ,[DateTimeStamp]
FROM t_Call_Type`;

    return await dbMssql.query(_query);
  } catch (error) {
    return error;
  }
};
