const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const { DB_HOST, PORT, IP_PUBLIC, DB_HDS, DB_AWDB, DB_RECORDING } = process.env;

const { FIELD_AGENT } = require("../helpers/constants");
const { checkKeyValueExists } = require("../helpers/functions");
/**
 * Tai lieu procedure:
 * 
 * Ping Team Lead tao procedure (neu chua co)
 * Nhận mã procedure từ Team Lead
 * Viết procedure: query, tạo bảng tạm, ...
 * exec procedure: chạy procedure
 */
exports.reportAutocallBroadcast = async (db, dbMssql, query, body) => {
  try {
    let { } = query;
    let { startDate, endDate, SkillGroup, page, row, download, paging } = body;
    let _query = `USE tempdb
    exec autocall_broadcast_sp '${startDate}', '${endDate}', ${SkillGroup}, ${page}`;

    if(paging == 0){
      _query = `USE tempdb
      exec autocall_broadcast_total_sp '${startDate}', '${endDate}', ${SkillGroup}`;
    }

    if(download == 1){
      _query = `USE tempdb
      exec autocall_broadcast_all_sp '${startDate}', '${endDate}', ${SkillGroup}`;
    }
    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};