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

exports.byDigitDialedByDay = async (db, dbMssql, query, callType) => {
  try {
    let { pages, rows, queue, startDate, endDate, paging } = query;
    let { CT_IVR, CT_Tranfer, DigitsDialed } = callType;
    let _query = '';
    let g_CallType = []; // group CallType
    let g_SkillGroup = []; // group SkillGroup

    Object.keys(callType).forEach((item) => {
      if (item.includes("SG_Voice_")) {
        let groupNumber = item.replace("SG_Voice_", "");
        g_CallType.push(`${callType[`CT_ToAgentGroup${groupNumber}`]},${callType[`CT_Queue${groupNumber}`]}`);
        g_SkillGroup.push(`${callType[item]}`);
      }
    });

    _query = `
    USE tempdb
    DECLARE @p_startTime  varchar(2000) = '${startDate}';
    DECLARE @p_endTime  varchar(2000) =  '${endDate}';
    DECLARE @p_page int = ${pages || 1};
    DECLARE @p_limit int = ${rows || 10};
    DECLARE @p_paging INT = 0; -- 1: return total result; 0: return list result
    DECLARE @p_CT_IVR varchar(2000) = '${CT_IVR || '#'}';
    DECLARE @p_CT_Tranfer varchar(2000)  = '${CT_Tranfer || '#'}';
    DECLARE @p_CT varchar(2000) = '${g_CallType.join(';')}'; -- 'CT_ToAgentGroup1,CT_Queue1;CT_ToAgentGroup2,CT_Queue2...'
    DECLARE @p_SG varchar(2000) = '${g_SkillGroup.join(',')}';
    DECLARE @p_DigitsDialed varchar(2000) = '${[DigitsDialed.MB || '#', DigitsDialed.MN || '#'].join(',')}'; -- dau so nha mang theo Mien (Nam / Bac)

    exec stt_c_ib_by_digit_dialed_by_day @p_startTime, @p_endTime, @p_page, @p_limit, @p_paging, @p_CT_IVR, @p_CT_Tranfer, @p_CT, @p_SG, @p_DigitsDialed
    `;

    _logger.log("info", `statisticInboundByDay ${_query}`);

    let resultQuery = await dbMssql.query(_query);

    return resultQuery;
  } catch (error) {
    throw new Error(error);
  }
};
