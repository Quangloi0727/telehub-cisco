/**
 * require Model
 */
const _model = require("../models/reportCustomizeModal");
const _baseModel = require("../models/baseModel");

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
  FIELD_AGENT,
  TYPE_MISSCALL,
  TYPE_CALL_HANDLE,
} = require("../helpers/constants");

const {
  checkKeyValueExists,
  reasonToTelehub,
  variableSQL,
  hms,
} = require("../helpers/functions");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

const TEXT_20_80 = {
  total_offered: "Tổng cuộc gọi vào hệ thống",
  total_queue: "Tổng cuộc gọi vào queue",
  total_queue_handle: "Cuộc gọi được phục vụ theo queue",
  ratio_queue_handle: "Tỷ lệ phục vụ theo queue",
  total_handle_lt20: "Cuộc gọi kết nối có thời gian chờ dưới 20s",
  total_handle_gt20: "Cuộc gọi kết nối có thời gian chờ trên 20s",
};
/**
 * Report 20 - 80 của GGG
 */
exports.report2080 = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    Object.keys(query).forEach((item) => {
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
    });

    const doc = await _model.lastTCDRecord(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: mapping2080(doc, query) });
  } catch (error) {
    next(error);
  }
};

/**
 * Report 20 - 80 của GGG
 */
exports.reportIncomingCallTrends = async (req, res, next) => {
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
    Object.keys(query).forEach((item) => {
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
    });

    const doc = await _model.lastTCDRecord(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res
      .status(SUCCESS_200.code)
      .json({ data: mappingIncomingCallTrends(doc, query) });
  } catch (error) {
    next(error);
  }
};

function mapping2080(data, query) {
  let { recordset } = data;

  let result = [];

  let { skillGroups } = query;
  if (skillGroups) skillGroups = skillGroups.split(",");

  // dòng "Tổng các cuộc gọi vào hệ thống"

  result.push({
    name: TEXT_20_80.total_offered,
    childs: [rowData("", recordset.length)],
  });

  //   "Tổng cuộc gọi váo queue",
  result.push(totalCallQueue(recordset, query));
  //   "Cuộc gọi được phục vụ theo queue",
  result.push(totalCallQueueHandle(recordset, query));
  //   "Tỷ lệ phục vụ theo queue",
  result.push(ratioCallQueueHandle(recordset, query));
  //   "Cuộc gọi kết nối có thời gian chờ dưới 20s",
  result.push(totalCallHandleLT20(recordset, query));
  //   "Cuộc gọi kết nối có thời gian chờ trên 20s",
  result.push(totalCallHandleGT20(recordset, query));
  data.recordset = result;
  return data;
}

/**
 * Mô tả các giá trị trên mỗi dòng trong "Báo cáo 20 - 80"
 * @param {string} name Nhóm
 * @param {string} result Kết quả
 * @param {string} ratio Tỷ lệ
 * @param {string} target Chỉ tiêu
 */
function rowData(name, result, ratio = "", target = "") {
  return {
    name,
    target,
    result,
    ratio,
  };
}

//   "Tổng cuộc gọi vào queue",
function totalCallQueue(data, query) {
  let { SG_Voice_1, SG_Voice_2, SG_Voice_3 } = query;
  let result = {
    name: TEXT_20_80.total_queue,
    childs: [],
  };
  let filterData = data.filter(
    (i) => i.CallTypeTXT != reasonToTelehub(TYPE_MISSCALL.MissIVR)
  );
  let countBySG = _.countBy(filterData, "EnterpriseName");
  //   console.log(countBySG);

  // Total
  result.childs.push(rowData("Total", filterData.length));

  // element
  Object.keys(countBySG)
    .sort()
    .forEach((i) => result.childs.push(rowData(i, countBySG[i])));

  return result;
}

//   "Cuộc gọi được phục vụ theo queue",
function totalCallQueueHandle(data, query) {
  let { SG_Voice_1, SG_Voice_2, SG_Voice_3 } = query;
  let result = {
    name: TEXT_20_80.total_queue_handle,
    childs: [],
  };
  let filterData = data.filter(
    (i) => i.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)
  );
  let countBySG = _.countBy(filterData, "EnterpriseName");
  //   console.log(countBySG);

  // Total
  result.childs.push(rowData("Total", filterData.length));

  // element
  Object.keys(countBySG)
    .sort()
    .forEach((i) => result.childs.push(rowData(i, countBySG[i])));

  return result;
}

//   "Tỷ lệ phục vụ theo queue",
function ratioCallQueueHandle(data, query) {
  let { SG_Voice_1, SG_Voice_2, SG_Voice_3 } = query;
  let result = {
    name: TEXT_20_80.ratio_queue_handle,
    childs: [],
  };
  let RTCQueue = totalCallQueue(data, query).childs;
  let RTCQueueHandle = totalCallQueueHandle(data, query).childs;

  // Total

  RTCQueue.sort().forEach((i, index) => {
    if (i.name == "Total")
      result.childs.unshift(
        rowData(
          "Total",
          `${RTCQueueHandle[0].result} / ${RTCQueue[0].result}`,
          (RTCQueueHandle[0].result
            ? (RTCQueueHandle[0].result / RTCQueue[0].result) * 100
            : 0
          ).toFixed() + " %"
        )
      );
    else
      result.childs.push(
        rowData(
          i.name,
          `${RTCQueueHandle[index] ? RTCQueueHandle[index].result : ""} / ${
            RTCQueue[index].result
          }`,
          (RTCQueueHandle[index]
            ? (RTCQueueHandle[index].result / RTCQueue[index].result) * 100
            : 0
          ).toFixed() + " %"
        )
      );
  });

  return result;
}

//   "Cuộc gọi kết nối có thời gian chờ dưới 20s",
function totalCallHandleLT20(data, query) {
  let { SG_Voice_1, SG_Voice_2, SG_Voice_3 } = query;
  let result = {
    name: TEXT_20_80.total_handle_lt20,
    childs: [],
  };
  let filterData = data.filter(
    (i) =>
      i.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE) &&
      i.Duration - i.TalkTime <= 20
  );
  let RTCQueueHandle = totalCallQueueHandle(data, query).childs;

  let countBySG = _.countBy(filterData, "EnterpriseName");

  // Total
  result.childs.push(
    rowData(
      "Total",
      `${filterData.length} / ${RTCQueueHandle[0].result}`,
      (filterData.length
        ? (filterData.length / RTCQueueHandle[0].result) * 100
        : 0
      ).toFixed() + " %"
    )
  );

  // element
  Object.keys(countBySG)
    .sort()
    .forEach((i, index) => {
      let RTCHFound = RTCQueueHandle.find((j) => j.name == i);

      result.childs.push(
        rowData(
          i,
          `${countBySG[i]} / ${RTCHFound.result}`,
          ((countBySG[i] / RTCHFound.result) * 100).toFixed() + " %"
        )
      );
    });

  return result;
}

//   "Cuộc gọi kết nối có thời gian chờ trên 20s",
function totalCallHandleGT20(data, query) {
  let { SG_Voice_1, SG_Voice_2, SG_Voice_3 } = query;
  let result = {
    name: TEXT_20_80.total_handle_gt20,
    childs: [],
  };
  let filterData = data.filter(
    (i) =>
      i.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE) &&
      i.Duration - i.TalkTime > 20
  );

  let RTCQueueHandle = totalCallQueueHandle(data, query).childs;

  let countBySG = _.countBy(filterData, "EnterpriseName");

  // Total
  result.childs.push(
    rowData(
      "Total",
      `${filterData.length} / ${RTCQueueHandle[0].result}`,
      (filterData.length
        ? (filterData.length / RTCQueueHandle[0].result) * 100
        : 0
      ).toFixed() + " %"
    )
  );

  // element
  Object.keys(countBySG)
    .sort()
    .forEach((i) => {
      let RTCHFound = RTCQueueHandle.find((j) => j.name == i);

      result.childs.push(
        rowData(
          i,
          `${countBySG[i]} / ${RTCHFound.result}`,
          ((countBySG[i] / RTCHFound.result) * 100).toFixed() + " %"
        )
      );
    });

  return result;
}

function mappingIncomingCallTrends(data, query) {
  let { recordset } = data;

  let groupByDateTimeBlock = _.groupBy(recordset, "HourMinuteBlock");

  // data vẽ table
  let result = [];

  // giá trị dòng SUMMARY
  let rowTotal = initDataRow("SUMMARY", 0);

  let { skillGroups } = query;
  if (skillGroups) skillGroups = skillGroups.split(",");

  Object.keys(groupByDateTimeBlock)
    .sort()
    .forEach((item) => {
      let element = groupByDateTimeBlock[item];

      let reduceTemp = element.reduce(
        handleReduceFunc,
        initDataRow(item, element.length)
      );
      // end reduce

      reduceTemp.AbdCall = reduceTemp.ReceivedCall - reduceTemp.ServedCall;
      /**
       * chờ confirm để tính
       * 20/11/2020:
       * AVERAGE TIME OF WAITING:
        Trung bình thời gian chờ
        Công thức tính:
        Thời gian chờ trung bình = [Tổng thời gian chờ]/ Tổng cuộc gọi  vào ACD

       * Thời gian chờ: Là thời gian tính từ thời điểm KH bấm phím để vào ACD tới khi agent nghe máy hoặc KH ngắt máy
       */
      reduceTemp.avgTimeWaiting = hms((
        reduceTemp.totalWaitTimeQueue/reduceTemp.ReceivedCall
      )); 

      reduceTemp.avgHandlingTime = hms(
        reduceTemp.totalDuarationHandling / reduceTemp.ServedCall
      );
      reduceTemp.Efficiency = reduceTemp.ServedCall
        ? reduceTemp.ServedCall /
          (reduceTemp.ReceivedCall - reduceTemp.AbdIn15s)
        : 0;
      
      let countByMinuteTime = _.countBy(element, "MinuteTimeBlock"); 
      let maxInMinuteTime = _.max(Object.keys(countByMinuteTime).map(i => countByMinuteTime[i]));
      reduceTemp.MaxNumSimultaneousCall = maxInMinuteTime;
      result.push(reduceTemp);

      rowTotal.Inbound += reduceTemp.Inbound;
      rowTotal.StopIVR += reduceTemp.StopIVR;
      rowTotal.ReceivedCall += reduceTemp.ReceivedCall;
      rowTotal.ServedCall += reduceTemp.ServedCall;
      rowTotal.MissCall += reduceTemp.MissCall;
      rowTotal.AbdCall += reduceTemp.AbdCall;
      rowTotal.AbdIn15s += reduceTemp.AbdIn15s;
      rowTotal.AbdAfter15s += reduceTemp.AbdAfter15s;
    });

  data.recordset = result;
  data.rowTotal = rowTotal;

  return data;
}

function handleReduceFunc(pre, cur) {
  // Thời gian chờ: abandon waiting time trong queue;
  // let waitTimeQueue = cur.Duration - cur.TalkTime;
  let {
    waitTimeQueue, waitTimeAnwser
  } = cur;
  
  if (cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissIVR)) pre.StopIVR++;
  if (cur.CallTypeTXT != reasonToTelehub(TYPE_MISSCALL.MissIVR))
    pre.ReceivedCall++;

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.ServedCall++;
    pre.totalDuarationHandling += cur.TalkTime + cur.HoldTime;

    if (waitTimeAnwser > pre.LongestWaitingTime)
      pre.LongestWaitingTime = waitTimeAnwser;
  }

  if (
    cur.CallTypeTXT != reasonToTelehub(TYPE_CALL_HANDLE) &&
    cur.CallTypeTXT != reasonToTelehub(TYPE_MISSCALL.MissIVR)
  )
    pre.MissCall++;

  if (
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissQueue) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissShortCall) ||
    cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)
  ) {
    if (waitTimeQueue <= 15) pre.AbdIn15s++;
    if (waitTimeQueue > 15) {
      pre.AbdAfter15s++;
    }
  }

  pre.totalWaitTimeQueue += waitTimeQueue

  return pre;
}

function initDataRow(HourMinuteBlock, Inbound) {
  return {
    HourMinuteBlock,
    Inbound,
    StopIVR: 0,
    ReceivedCall: 0,
    ServedCall: 0,
    MissCall: 0,
    AbdCall: 0,
    AbdIn15s: 0,
    AbdAfter15s: 0,
    totalDuarationHandling: 0,
    MaxNumSimultaneousCall: 0,
    LongestWaitingTime: 0,
    totalWaitTimeQueue: 0, // tổng thời gian chờ trong queue
  };
}
