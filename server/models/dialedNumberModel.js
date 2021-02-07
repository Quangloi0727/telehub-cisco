const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB,DB_RECORDING } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");

exports.getDialedNumberByPrefix = async (db, dbMssql, query) => {
  try {
    let { Prefix } = query;

    let _query = `
    SELECT 
    [DialedNumberID],
    [CustomerDefinitionID],
    [LabelID],
    [EnterpriseName],
    [RoutingClientID],
    [DialedNumberString],
    [Description],
    [Deleted],
    [MRDomainID],
    [ChangeStamp],
    [PermitApplicationRouting],
    [ReservedByIVR],
    [DepartmentID],
    [PCSPattern],
    [RingtoneName],
    [DateTimeStamp]
FROM [${DB_AWDB}].[dbo].[t_Dialed_Number]
WHERE EnterpriseName LIKE '%${Prefix}%'
AND MRDomainID=1`;

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};
