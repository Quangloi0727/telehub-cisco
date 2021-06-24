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
    let { startDate, endDate, SkillGroup, page, row, download, paging, campainId } = body;
    let _query = `USE tempdb
    exec autocall_broadcast_sp '${startDate}', '${endDate}', ${page}, ${row}, '${campainId.join(',') || "#"}'`;

    if (paging == 0) {
      _query = `USE tempdb
      exec autocall_broadcast_total_sp '${startDate}', '${endDate}', '${campainId.join(',') || "#"}'`;
    }

    // if(download == 1){
    //   _query = `USE tempdb
    //   exec dev_autocall_broadcast_all_sp '${startDate}', '${endDate}', '${campainId.join(',')  || "#"}'`;
    // }
    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportAutocallSurvey = async (db, dbMssql, query, body) => {
  try {
    let { } = query;
    let { startDate, endDate, SkillGroup, page, row, download, paging, campainId } = body;
    let _query = `USE tempdb
    exec autocall_callsurvey_sp '${startDate}', '${endDate}', ${page}, ${row}, '${campainId.join(',') || "#"}'`;

    if (paging == 0) {
      _query = `USE tempdb
      exec autocall_survey_total_sp '${startDate}', '${endDate}', '${campainId.join(',') || "#"}'`;
    }

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportInboundImpactByAgent = async (db, dbMssql, query, body) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, download, ANI, idAgentCisco, agentTeam, flag } = query;
    let _query = '';
    let g_CallType = []; // group CallType
    let g_SkillGroup = []; // group SkillGroup

    Object.keys(query).forEach((item) => {
      if (item.includes("SG_Voice_")) {
        let groupNumber = item.replace("SG_Voice_", "");
        g_CallType.push(`${query[`CT_ToAgentGroup${groupNumber}`]},${query[`CT_Queue${groupNumber}`]}`);
        g_SkillGroup.push(`${query[item]}`);
      }
    });

    _query = `USE tempdb exec report_inbound_impact_by_agent_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}' `;

    if (flag && flag == "1") {
      _query = `USE tempdb exec report_inbound_impact_by_agent_total_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}' `;
    }

    _logger.log("info", `reportInboundImpactByAgent ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};