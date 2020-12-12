/**
 * require Model
 */
const _model = require("../models/reportTRCallTypeModel");
const _modelReportCustomizeModal = require("../models/reportCustomizeModal");
const _baseModel = require("../models/baseModel");
const moment = require("moment");

/**
 * require Controller
 */
const base = require("./baseController");

/**
 * require Helpers
 */

const {
  SUCCESS_200,
  ERR_400,
  ERR_404,
  ERR_500,
} = require("../helpers/constants/statusCodeHTTP");

const {
  FIELD_AGENT,
  TYPE_MISSCALL,
  TYPE_CALL_HANDLE,
} = require("../helpers/constants");
const {
  genHour,
  reasonToTelehub,
  hms,
  hmsToNumber,
} = require("../helpers/functions");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

exports.getAll = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (
      !query.startDate ||
      !query.endDate ||
      !query.CT_ToAgentGroup1 ||
      !query.CT_ToAgentGroup2 ||
      !query.CT_ToAgentGroup3
    )
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    const doc = await _model.getAll(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy dữ liệu trong bảng TCD - [ins1_hds].[dbo].[t_Termination_Call_Detail]
 * - bản tin TCD cuối cùng của cuộc gọi
 */
exports.lastTCDRecord = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    /**
     * Check việc khởi tạo các CallType
     * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
     */
    for (let i = 0; i < Object.keys(query).length; i++) {
      const item = Object.keys(query)[i];
      // const element = query[item];
      if (item.includes("CT_ToAgentGroup")) {
        let groupNumber = item.replace("CT_ToAgentGroup", "");

        if (!query[`CT_Queue${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
            ),
            req,
            res,
            next
          );
        }

        if (!query[`SG_Voice_${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
            ),
            req,
            res,
            next
          );
        }
      }
    }

    const doc = await _modelReportCustomizeModal.lastTCDRecord(
      db,
      dbMssql,
      query
    );

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy dữ liệu trong bảng TCD - [ins1_hds].[dbo].[t_Termination_Call_Detail]
 * - bản tin TCD cuối cùng của cuộc gọi
 * Phục vụ cho trang:
 * Dash board
 * Dash board Kplus
 */
exports.statisticInHourByDay = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    /**
     * Check việc khởi tạo các CallType
     * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
     */
    for (let i = 0; i < Object.keys(query).length; i++) {
      const item = Object.keys(query)[i];
      // const element = query[item];
      if (item.includes("CT_ToAgentGroup")) {
        let groupNumber = item.replace("CT_ToAgentGroup", "");

        if (!query[`CT_Queue${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
            ),
            req,
            res,
            next
          );
        }

        if (!query[`SG_Voice_${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
            ),
            req,
            res,
            next
          );
        }
      }
    }

    const doc = await _modelReportCustomizeModal.lastTCDRecord(
      db,
      dbMssql,
      query
    );

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res
      .status(SUCCESS_200.code)
      .json({ data: mappingStatisticInHourToday(doc, query) });
  } catch (error) {
    next(error);
  }
};
/**
 * Khởi tạo dòng
 * @param {String} name giờ tổng hợp
 * @param {Number} Inbound số cuộc gọi vào hệ thống
 *
 * connect: các cuộc gọi handle có talk time > 0
 */
function initDataRow(name, Inbound) {
  return {
    block: name,
    total: Inbound,
    AbdIn15s: 0,
    connect: 0,
  };
}

function mappingStatisticInHourToday(data, query) {
  let { recordset } = data;

  let groupByKey = _.groupBy(recordset, "HourBlock");

  // data vẽ table
  let result = [];

  // giá trị dòng SUMMARY
  let rowTotal = initDataRow("SUMMARY", 0);

  // let { skillGroups } = query;
  // if (skillGroups) skillGroups = skillGroups.split(",");
  let startTime = moment(query.startDate, "YYYY-MM-DD HH:mm:ss", true);
  let endTime = moment(query.endDate, "YYYY-MM-DD HH:mm:ss", true);

  let hourQuery = genHour(startTime, endTime);

  hourQuery.sort().forEach((item, index) => {
    let dataFound = Object.keys(groupByKey).find((i) => Number(item) == i);

    let element = dataFound ? groupByKey[dataFound] : [];

    let reduceTemp = element.reduce(
      handleReduceFunc,
      initDataRow(item, element.length)
    );
    // end reduce

    result.push(reduceTemp);

    rowTotal.total += reduceTemp.total;
    rowTotal.connect += reduceTemp.connect;
    rowTotal.AbdIn15s += reduceTemp.AbdIn15s;

    if (index === hourQuery.length - 1) {
      result.push(rowTotal);
    }
  });

  data.recordset = _.sortBy(result, "block");

  data.rowTotal = rowTotal;
  return data;
}

function handleReduceFunc(pre, cur) {

  let { waitTimeQueue, waitTimeAnwser } = cur;

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.connect++;
  }

  if (
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissQueue) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissShortCall) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)
  ) {
    if (waitTimeQueue <= 15) pre.AbdIn15s++;
    if (waitTimeQueue > 15) {
      // pre.AbdAfter15s++;
    }
  }
  
  return pre;
}
