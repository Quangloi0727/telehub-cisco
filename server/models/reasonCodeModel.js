const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists, variableSQL } = require("../helpers/functions");
module.exports = {
  getAll,
};

async function getAll(db, dbMssql, query) {
  try {
    let _query = `select * FROM [${DB_AWDB}].[dbo].[t_Reason_Code]`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
}
