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
  TYPE_CALLTYPE,
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

/**
 * Lấy dữ liệu trong bảng [ins1_awdb].[dbo].[t_Call_Type_Real_Time]
 * - dữ liệu real time theo call type
 */
exports.statisticRealtime = statisticRealtime;
exports.statisticInbound = statisticInbound;
exports.inOverAllAgent = inOverAllAgent;

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
 * 
 * *** Mô tả comment *********************************
 * *** Ngày: 2020-12-24
 * *** Dev: hainv
 * *** Lý do: chỉnh sửa theo nghiệp vụ
 * ...
 * *** Cách khắc phục duplicated:
 * ...
 *
  VOLUME
  Phục vụ
  ABD < 15
 */
function initDataRow(name, Inbound) {
  return {
    block: name,
    total: Inbound, // total = ivr + ReceivedCall
    volume: 0, // VOLUME = ReceivedCall
    AbdIn15s: 0, // ABD < 15,
    AbdAfter15s: 0, // ABD > 15
    connect: 0, // Phục vụ
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
    rowTotal.volume += reduceTemp.volume;
    rowTotal.connect += reduceTemp.connect;
    rowTotal.AbdIn15s += reduceTemp.AbdIn15s;
    rowTotal.AbdAfter15s += reduceTemp.AbdAfter15s;

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

  if (cur.CallTypeTXT != reasonToTelehub(TYPE_MISSCALL.MissIVR)) {
    pre.volume++;
  }

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.connect++;
  }

  if (
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissQueue) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissShortCall) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.Other) // && cur.CallDisposition == 1 =1 Lỗi mạng
  ) {
    if (waitTimeQueue <= 15) pre.AbdIn15s++;
    if (waitTimeQueue > 15) {
      pre.AbdAfter15s++;
    }
  }

  return pre;
}

async function statisticRealtime(req, res, next) {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    // if (!query.startDate || !query.endDate || !query.CT_IVR)
    //   return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

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

        // if (!query[`SG_Voice_${groupNumber}`]) {
        //   return next(
        //     new ResError(
        //       ERR_400.code,
        //       `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
        //     ),
        //     req,
        //     res,
        //     next
        //   );
        // }
      }
    }

    const doc = await _model.realtime(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: mappingStatisticRealtime(doc) });
  } catch (error) {
    next(error);
  }
}

function mappingStatisticRealtime(data, query) {
  let { recordset } = data;
  let result = {
    RouterCallsQNow: 0, // Số CG chờ trong Queue, Là những cuộc khách hàng bấm phím để vào Queue (đang trong lúc chờ gặp Agent) (bắt realtime)
    RouterCallsQNowTime: 0, // Thời gian chờ
    Call_Queue: 0, // Số CG chờ với CallType là queue
    Call_QueueTime: 0, // Số CG chờ với CallType là queue
    Call_ToAgent: 0, // Số CG chờ với CallType là ToAgent
    Call_ToAgentTime: 0, // Số CG chờ với CallType là ToAgent
  };

  Object.keys(recordset).forEach((item, index) => {
    let element = recordset[item];

    switch (element.CallTypeDefined) {
      case TYPE_CALLTYPE.CT_Queue:
        if (element.RouterCallsQNow > 0)
          result.Call_Queue += element.RouterCallsQNow;
        result.Call_QueueTime += element.RouterCallsQNowTime;
        break;
      case TYPE_CALLTYPE.CT_ToAgentGroup:
        if (element.RouterCallsQNow > 0) {
          logger.log("info", "Call_ToAgent", element.RouterCallsQNow);
          result.Call_ToAgent += element.RouterCallsQNow;
          result.Call_ToAgentTime += element.RouterCallsQNowTime;
        }
        break;
      case TYPE_CALLTYPE.CT_IVR:
      case TYPE_CALLTYPE.CT_Tranfer:
      case TYPE_CALLTYPE.unknown:
      default:
        break;
    }
  });

  result.RouterCallsQNow = result.Call_Queue; // + result.Call_ToAgent;
  result.RouterCallsQNowTime = result.Call_QueueTime; // + result.Call_ToAgent;

  data.recordset = result;

  // data.rowTotal = rowTotal;
  return data;
}

/**
 * Lấy dữ liệu trong bảng TCD - [ins1_hds].[dbo].[t_Termination_Call_Detail]
 * - bản tin TCD cuối cùng của cuộc gọi
 * Phục vụ cho trang:
 * Dash board
 * Dash board Kplus
 */
async function statisticInbound(req, res, next) {
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
      .json({ data: mappingStatisticInbound(doc, query) });
  } catch (error) {
    next(error);
  }
}

function mappingStatisticInbound(data, query) {
  let { recordset } = data;

  // let startTime = moment(query.startDate, "YYYY-MM-DD HH:mm:ss", true);
  // let endTime = moment(query.endDate, "YYYY-MM-DD HH:mm:ss", true);

  let reduceTemp = recordset.reduce(handleReduceFuncInbound, {
    block: "inbound",
    total: recordset.length, // total = ivr + ReceivedCall
    // volume: 0, // VOLUME = ReceivedCall
    // AbdIn15s: 0,  // ABD < 15,
    // AbdAfter15s: 0,  // ABD > 15
    missed: 0, // missIVR + missQueue
    connect: 0, // Phục vụ, handle
  });

  reduceTemp.missed = reduceTemp.total - reduceTemp.connect;

  data.recordset = reduceTemp;

  return data;
}

function handleReduceFuncInbound(pre, cur) {
  let { waitTimeQueue, waitTimeAnwser } = cur;

  if (
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissIVR) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissQueue)
  ) {
    pre.missed++;
  }
  // if (cur.CallTypeTXT != reasonToTelehub(TYPE_MISSCALL.MissIVR)){
  //   pre.volume++;
  // }

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.connect++;
  }

  // if (
  //   cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissQueue) ||
  //   cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissShortCall) ||
  //   cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)
  //   || (cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.Other)) // && cur.CallDisposition == 1 =1 Lỗi mạng
  // ) {
  //   if (waitTimeQueue <= 15) pre.AbdIn15s++;
  //   if (waitTimeQueue > 15) {
  //     pre.AbdAfter15s++;
  //   }
  // }

  return pre;
}

/**
 * Lấy dữ liệu trong bảng TCD - [ins1_hds].[dbo].[t_Termination_Call_Detail]
 * - bản tin TCD cuối cùng của cuộc gọi
 * Phục vụ cho trang:
 * Dash board
 * Dash board Kplus
 */
async function inOverAllAgent(req, res, next) {
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
      .json({ data: mappingInOverAllAgent(doc, query) });
  } catch (error) {
    next(error);
  }
}

function mappingInOverAllAgent(data, query) {
  let { recordset } = data;

  // Chỉ lấy các cuộc có AgentPeripheralNumber khác null
  let dataFilter = recordset.filter(i => i.AgentPeripheralNumber !== null);

  let groupByKey = _.groupBy(dataFilter, "AgentPeripheralNumber");
  // data vẽ table
  let result = [];

  // giá trị dòng SUMMARY
  // let rowTotal = initDataRow("SUMMARY", 0);

  // let { skillGroups } = query;
  // if (skillGroups) skillGroups = skillGroups.split(",");
  // let startTime = moment(query.startDate, "YYYY-MM-DD HH:mm:ss", true);
  // let endTime = moment(query.endDate, "YYYY-MM-DD HH:mm:ss", true);

  // let hourQuery = genHour(startTime, endTime);
  let totalSumsDuration = 0;

  Object.keys(groupByKey).forEach((item, index) => {
    // let dataFound = Object.keys(groupByKey).find((i) => Number(item) == i);

    let element = groupByKey[item];

    let reduceTemp = element.reduce(handleReduceFuncInOverAllAgent, {
      block: item,
      total: element.length, // total = trừ Miss IVR
      // volume: 0, // VOLUME = ReceivedCall
      // AbdIn15s: 0,  // ABD < 15,
      // AbdAfter15s: 0,  // ABD > 15
      missed: 0, // khác handle là missed
      SumsDuration: 0, // Tổng thời gian phục vụ
      MinDuration: 0, // Thời gian phục vụ ngắn nhất
      MaxDuration: 0, // Thời gian phục vụ dài nhất
      connect: 0, // Phục vụ, handle
    });
    // // end reduce
    totalSumsDuration += reduceTemp.SumsDuration;
    
    result.push(reduceTemp);

    // rowTotal.total += reduceTemp.total;
    // rowTotal.volume += reduceTemp.volume;
    // rowTotal.connect += reduceTemp.connect;
    // rowTotal.AbdIn15s += reduceTemp.AbdIn15s;
    // rowTotal.AbdAfter15s += reduceTemp.AbdAfter15s;

    // if (index === hourQuery.length - 1) {
    //   result.push(rowTotal);
    // }
  });

  data.recordset = _.sortBy(result, "block");

  // data.rowTotal = rowTotal;

  return data;
}

function handleReduceFuncInOverAllAgent(pre, cur) {
  let { waitTimeQueue, waitTimeAnwser, TotalDuarationHandling } = cur;

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.connect++;
    pre.SumsDuration += TotalDuarationHandling;

    if(pre.MinDuration > 0){
      if(TotalDuarationHandling < pre.MinDuration) pre.MinDuration = TotalDuarationHandling;
    }else {
      pre.MinDuration = TotalDuarationHandling;
    }
    

    if(TotalDuarationHandling > pre.MaxDuration) pre.MaxDuration = TotalDuarationHandling;

  }

  if (cur.CallTypeTXT !== reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.missed++;
    console.log("InOverAllAgent", "reasonMiss", cur.CallTypeTXT);
  }

  return pre;
}