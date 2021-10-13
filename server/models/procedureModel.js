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
    let _query = `USE ins1_recording
    exec autocall_broadcast_sp '${startDate}', '${endDate}', ${page}, ${row}, '${campainId.join(',') || "#"}'`;

    if (paging == 0) {
      _query = `USE ins1_recording
      exec autocall_broadcast_total_sp '${startDate}', '${endDate}', '${campainId.join(',') || "#"}'`;
    }

    // if(download == 1){
    //   _query = `USE ins1_recording
    //   exec dev_autocall_broadcast_all_sp '${startDate}', '${endDate}', '${campainId.join(',')  || "#"}'`;
    // }
    _logger.log("info", `reportAutocallBroadcast ${_query}`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportAutocallSurvey = async (db, dbMssql, query, body) => {
  try {
    let { } = query;
    let { startDate, endDate, SkillGroup, page, row, download, paging, campainId } = body;
    let _query = `USE ins1_recording
    exec autocall_callsurvey_sp '${startDate}', '${endDate}', ${page}, ${row}, '${campainId.join(',') || "#"}'`;

    if (paging == 0) {
      _query = `USE ins1_recording
      exec autocall_survey_total_sp '${startDate}', '${endDate}', '${campainId.join(',') || "#"}'`;
    }
    _logger.log("info", `reportAutocallSurvey ${_query}`);

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportAutocallSurvey2 = async (db, dbMssql, query, body) => {
  try {
    let { } = query;
    let { startDate, endDate, SkillGroup, page, row, download, paging, campainId } = body;
    let _query = `USE ins1_recording
    exec autocall_callsurvey2_sp '${startDate}', '${endDate}', ${page}, ${row}, '${campainId.join(',') || "#"}'`;

    if (paging == 0) {
      _query = `USE ins1_recording
      exec autocall_survey2_total_sp '${startDate}', '${endDate}', '${campainId.join(',') || "#"}'`;
    }

    return await dbMssql.query(_query);
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportInboundImpactByAgent = async (db, dbMssql, query, body) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, ANI, idAgentCisco, agentTeam, flag } = query;
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

    _query = `USE ins1_recording exec report_inbound_impact_by_agent_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}' `;

    if (flag && flag == "1") {
      _query = `USE ins1_recording exec report_inbound_impact_by_agent_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}' `;
    }

    if (flag && flag == "2") {
      _query = `USE ins1_recording exec report_inbound_impact_by_agent_total_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}' `;
    }

    _logger.log("info", `reportInboundImpactByAgent ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportCallByCustomerKH01 = async (db, dbMssql, query, body) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, ANI, flag } = query;
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

    _query = `USE ins1_recording exec report_call_by_customer_kh01_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}'`;

    if (flag && flag == "1") {
      _query = `USE ins1_recording exec report_call_by_customer_kh01_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}'`;
    }

    if (flag && flag == "2") {
      _query = `USE ins1_recording exec report_call_by_customer_kh01_total_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${ANI || "#"}'`;
    }

    _logger.log("info", `reportCallByCustomerKH01 ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};


exports.reportDetailStatisticalStatusEndCall = async (db, dbMssql, query, body) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, statusEndCall, idAgentCisco, agentTeam, flag } = query;
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

    _query = `USE ins1_recording exec report_detail_statistical_status_end_call_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${statusEndCall || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}'`;

    if (flag && flag == "1") {
      _query = `USE ins1_recording exec report_detail_statistical_status_end_call_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${statusEndCall || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}'`;
    }

    if (flag && flag == "2") {
      _query = `USE ins1_recording exec report_detail_statistical_status_end_call_total_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${statusEndCall || "#"}','${idAgentCisco || "#"}','${agentTeam || "#"}'`;
    }

    _logger.log("info", `reportDetailStatisticalStatusEndCall ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};


exports.reportInboundMisscallAndConnectedByAgent = async (db, dbMssql, query, body) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, typeCall, ANI, flag } = query;
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

    _query = `USE ins1_recording exec report_inbound_misscall_and_connected_by_agent_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${typeCall || "#"}','${ANI || "#"}'`;

    if (flag && flag == "1") {
      _query = `USE ins1_recording exec report_inbound_misscall_and_connected_by_agent_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${typeCall || "#"}','${ANI || "#"}'`;
    }

    if (flag && flag == "2") {
      _query = `USE ins1_recording exec report_inbound_misscall_and_connected_by_agent_total_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${typeCall || "#"}','${ANI || "#"}'`;
    }

    _logger.log("info", `reportInboundMisscallAndConnectedByAgent ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};


exports.reportInboundByAgent = async (db, dbMssql, query, body) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, idAgentCisco, flag } = query;
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

    _query = `USE ins1_recording exec report_inbound_by_agent_sp '${startDate}', '${endDate}', ${pages}, ${rows}, 0, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${idAgentCisco || "#"}'`;

    if (flag && flag == "1") {
      _query = `USE ins1_recording exec report_inbound_by_agent_total_sp '${startDate}', '${endDate}', null, null, 1, ${CT_IVR}, ${CT_Tranfer}, '${g_CallType.join(';')}', '${g_SkillGroup.join(',')}','${idAgentCisco || "#"}'`;
    }

    _logger.log("info", `reportInboundByAgent ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportStatisticalOutbound = async (db, dbMssql, query, body) => {
  try {
    let { startDate, endDate, Agent_Team } = query;

    let _query = `USE ins1_recording exec report_statistical_outbound_total_sp '${startDate}', '${endDate}','${Agent_Team}'`;

    _logger.log("info", `reportStatisticalOutbound ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};

exports.statisticInboundByDay = async (db, dbMssql, query) => {
  try {
    let { pages, rows, queue, CT_IVR, CT_Tranfer, startDate, endDate, idAgentCisco, paging } = query;
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

    _query = `
    USE ins1_recording
    DECLARE @p_startTime  varchar(2000) = '${startDate}';
    DECLARE @p_endTime  varchar(2000) =  '${endDate}';
    DECLARE @p_page int = ${pages || 1};
    DECLARE @p_limit int = ${rows || 10};
    DECLARE @p_paging INT = 0; -- 1: return total result; 0: return list result
    DECLARE @p_CT_IVR varchar(2000) = '${CT_IVR}';
    DECLARE @p_CT_Tranfer varchar(2000)  = '${CT_Tranfer || '#'}';
    DECLARE @p_CT varchar(2000) = '${g_CallType.join(';')}'; -- 'CT_ToAgentGroup1,CT_Queue1;CT_ToAgentGroup2,CT_Queue2...'
    DECLARE @p_SG varchar(2000) = '${g_SkillGroup.join(',')}';
    DECLARE @p_Agent_Team varchar(2000) = '#'; 
    DECLARE @f_direction varchar(2000) = '#';
    DECLARE @f_group varchar(2000) = '#';

    exec statistic_call_inbound_by_day @p_startTime, @p_endTime, @p_page, @p_limit, @p_paging, @p_CT_IVR, @p_CT_Tranfer, @p_CT, @p_SG, @p_Agent_Team, @f_direction, @f_group
    `;

    _logger.log("info", `statisticInboundByDay ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};


exports.reportAcdSummaryDaily = async (db, dbMssql, query) => {
  try {
    let { CT_IVR, CT_Tranfer, startDate, endDate } = query;
    let _query = '';
    let g_CallType = [];
    let g_SkillGroup = [];

    Object.keys(query).forEach((item) => {
      if (item.includes("SG_Voice_")) {
        let groupNumber = item.replace("SG_Voice_", "");
        g_CallType.push(`${query[`CT_ToAgentGroup${groupNumber}`]},${query[`CT_Queue${groupNumber}`]}`);
        g_SkillGroup.push(`${query[item]}`);
      }
    });

    _query = `
      USE ins1_recording
      DECLARE @p_startTime  varchar(2000) = '${startDate}';
      DECLARE @p_endTime  varchar(2000) =  '${endDate}';
      DECLARE @p_CT_IVR varchar(2000) = '${CT_IVR}';
      DECLARE @p_CT_Tranfer varchar(2000)  = '${CT_Tranfer || '#'}';
      DECLARE @p_CT varchar(2000) = '${g_CallType.join(';')}'; -- 'CT_ToAgentGroup1,CT_Queue1;CT_ToAgentGroup2,CT_Queue2...'
      DECLARE @p_SG varchar(2000) = '${g_SkillGroup.join(',')}';

      exec report_inbound_daily_acd_summary @p_startTime, @p_endTime, @p_CT_IVR, @p_CT_Tranfer, @p_CT, @p_SG
    `;

    _logger.log('info', `------- _query ------- reportAcdSummaryDaily`);
    _logger.log('info', _query);
    _logger.log('info', `------- _query ------- reportAcdSummaryDaily`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery.recordset;
  } catch (error) {
    throw new Error(error);
  }
};

exports.reportInbound2080 = async (dbMssql, query) => {
  try {
    let { CT_IVR, CT_Tranfer, startDate, endDate, skillGroups } = query;
    let _query = '';
    let g_CallType = [];
    let g_SkillGroup = [];

    Object.keys(query).forEach((item) => {
      if (item.includes("SG_Voice_")) {
        let groupNumber = item.replace("SG_Voice_", "");
        g_CallType.push(`${query[`CT_ToAgentGroup${groupNumber}`]},${query[`CT_Queue${groupNumber}`]}`);
        g_SkillGroup.push(`${query[item]}`);
      }
    });

    _query = `
      USE ins1_recording
      DECLARE @p_startTime  varchar(2000) = '${startDate}';
      DECLARE @p_endTime  varchar(2000) =  '${endDate}';
      DECLARE @p_CT_IVR varchar(2000) = '${CT_IVR}';
      DECLARE @p_CT_Tranfer varchar(2000)  = '${CT_Tranfer || '#'}';
      DECLARE @p_CT varchar(2000) = '${g_CallType.join(';')}'; -- 'CT_ToAgentGroup1,CT_Queue1;CT_ToAgentGroup2,CT_Queue2...'
      DECLARE @p_SG varchar(2000) = '${g_SkillGroup.join(',')}';
      DECLARE @p_skillgroups varchar(2000) = '${skillGroups || '#'}';

      exec report_inbound_2080 @p_startTime, @p_endTime, @p_CT_IVR, @p_CT_Tranfer, @p_CT, @p_SG, @p_skillgroups
    `;

    _logger.log('info', `------- _query ------- reportAcdSummaryDaily`);
    _logger.log('info', _query);
    _logger.log('info', `------- _query ------- reportAcdSummaryDaily`);

    let resultQuery = await dbMssql.query(_query);

    return { recordset: resultQuery.recordset };
  } catch (error) {
    throw new Error(error);
  }
};