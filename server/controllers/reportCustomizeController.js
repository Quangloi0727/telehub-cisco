const fetch = require("node-fetch");
const moment = require("moment")

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
  hmsToNumber,
  percentFormat,
  roundAvg,
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
    };

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
 * Report IncomingCallTrends của Kplus
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
    };

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

/**
 * Report acd summary
 */
exports.reportACDSummary = async (req, res, next) => {
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
    };

    const doc = await _model.lastTCDRecord(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: mappingACDSummary(doc, query) });
  } catch (error) {
    next(error);
  }
};

/**
 * Report acd reportIVRMonth2Date
 */
exports.reportIVRMonth2Date = async (req, res, next) => {
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
    };

    // Lấy thông tin các cuộc bị nhỡ trên IVR để gửi làm báo cáo
    const docTCD = await _model.lastTCDRecord(db, dbMssql, query);

    if (!docTCD)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);

    let TCDIVR = docTCD.recordset
      .filter((i) => i.CallTypeTXT === reasonToTelehub(TYPE_MISSCALL.MissIVR))
      .map((i) => ({
        dateMonth: i.DayMonthBlock,
        code: "IVR",
        PhoneNumber: i.ANI,
      }));

    let TCDACD = docTCD.recordset
      .filter((i) => i.CallTypeTXT !== reasonToTelehub(TYPE_MISSCALL.MissIVR))
      .map((i) => ({
        dateMonth: i.DayMonthBlock,
        code: "ACD",
        PhoneNumber: i.ANI,
      }));

    let { url, pathReportMonth2Date, token } = _config["cisco-gateway"];

    const options = {
      method: "post",
      body: JSON.stringify({
        TCDIVR: _.countBy(TCDIVR, "dateMonth"),
        TCDACD: _.countBy(TCDACD, "dateMonth"),
      }),
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    };
    let _q = [];
    _q.push(`startDate=${query.startDate}`);
    _q.push(`endDate=${query.endDate}`);
    _q.push(`ternalID=${query.IVR_Code}`);
    console.log(url + pathReportMonth2Date + `?${_q.join("&")}`);
    const doc = await fetch(
      url + pathReportMonth2Date + `?${_q.join("&")}`,
      options
    ).then((res) => {
      return res.json();
    });

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);

    if (doc && doc.statusCode && doc.statusCode !== 200)
      return next(new ResError(doc.statusCode, doc.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json(doc);
  } catch (error) {
    next(error);
  }
};

exports.reportStatistic = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;
    /**
     * callType: CallType MN 1900
     * callTypeMB: CallType MB 1900
     * callType1800: CallType MN 1800
     * callTypeMB1800: CallType MB 1800
     */
    let { callType, callTypeMB, callType1800, callTypeMB1800 } = req.body;

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    if (callType) {
      callType.startDate = query.startDate;
      callType.endDate = query.endDate;
      /**
       * Check việc khởi tạo các CallType
       * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
       */
      Object.keys(callType).forEach((item) => {
        // const element = callType[item];
        if (item.includes("CT_ToAgentGroup")) {
          let groupNumber = item.replace("CT_ToAgentGroup", "");

          if (!callType[`CT_Queue${groupNumber}`]) {
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

          if (!callType[`SG_Voice_${groupNumber}`]) {
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
    }
    if (callTypeMB) {
      callTypeMB.startDate = query.startDate;
      callTypeMB.endDate = query.endDate;
      /**
       * Check việc khởi tạo các CallType
       * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
       */
      Object.keys(callTypeMB).forEach((item) => {
        // const element = callTypeMB[item];
        if (item.includes("CT_ToAgentGroup")) {
          let groupNumber = item.replace("CT_ToAgentGroup", "");

          if (!callTypeMB[`CT_Queue${groupNumber}`]) {
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

          if (!callTypeMB[`SG_Voice_${groupNumber}`]) {
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
    }
    if (callType1800) {
      callType1800.startDate = query.startDate;
      callType1800.endDate = query.endDate;
      /**
       * Check việc khởi tạo các CallType
       * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
       */
      Object.keys(callType1800).forEach((item) => {
        // const element = callType1800[item];
        if (item.includes("CT_ToAgentGroup")) {
          let groupNumber = item.replace("CT_ToAgentGroup", "");

          if (!callType1800[`CT_Queue${groupNumber}`]) {
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

          if (!callType1800[`SG_Voice_${groupNumber}`]) {
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
    }
    if (callTypeMB1800) {
      callTypeMB1800.startDate = query.startDate;
      callTypeMB1800.endDate = query.endDate;
      /**
       * Check việc khởi tạo các CallType
       * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
       */
      Object.keys(callTypeMB1800).forEach((item) => {
        // const element = callTypeMB1800[item];
        if (item.includes("CT_ToAgentGroup")) {
          let groupNumber = item.replace("CT_ToAgentGroup", "");

          if (!callTypeMB1800[`CT_Queue${groupNumber}`]) {
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

          if (!callTypeMB1800[`SG_Voice_${groupNumber}`]) {
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
    }

    // 1. báo cáo 1900 mien nam
    const doc1900 = await _model.lastTCDRecord(db, dbMssql, callType);
    // 2. báo cáo 1900 mien bac
    // 3. báo cáo 1800 mien nam
    // 4. báo cáo 1800 mien bac

    if (!doc1900)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({
      data: mappingStatistic(
        {
          doc1900: doc1900.recordset,
          doc1800: [],
          docMB1900: [],
          docMB1800: [],
        },
        {
          callType,
          callTypeMB,
          callType1800,
          callTypeMB1800,
        }
      ),
    });
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

  let groupByDayMonthBlock = _.groupBy(recordset, "HourMinuteBlock");

  // data vẽ table
  let result = [];

  // giá trị dòng SUMMARY
  let rowTotal = initDataRow("SUMMARY", 0);

  let { skillGroups } = query;
  if (skillGroups) skillGroups = skillGroups.split(",");

  Object.keys(groupByDayMonthBlock)
    .sort()
    .forEach((item) => {
      let element = groupByDayMonthBlock[item];

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
      reduceTemp.avgTimeWaiting = roundAvg(reduceTemp.ReceivedCall ? (
        reduceTemp.totalWaitTimeQueue / reduceTemp.ReceivedCall
      ) : 0 );

      reduceTemp.avgHandlingTime = roundAvg(reduceTemp.ServedCall ?  (
        reduceTemp.totalDuarationHandling / reduceTemp.ServedCall
      ) : 0);

      reduceTemp.Efficiency = (reduceTemp.ReceivedCall - reduceTemp.AbdIn15s)
        ? reduceTemp.ServedCall /
        (reduceTemp.ReceivedCall - reduceTemp.AbdIn15s)
        : 0;

      reduceTemp.LongestWaitingTime = reduceTemp.LongestWaitingTime;

      let countByMinuteTime = _.countBy(element, "MinuteTimeBlock");
      let maxInMinuteTime = _.max(
        Object.keys(countByMinuteTime).map((i) => countByMinuteTime[i])
      );
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
      rowTotal.totalWaitTimeQueue += reduceTemp.totalWaitTimeQueue
      rowTotal.totalDuarationHandling += reduceTemp.totalDuarationHandling
      // rowTotal.MaxNumSimultaneousCall = 
    });

  let resultName = _.pluck(result, 'name')
  let startTime = moment(query.startDateFilter || query.startDate, 'YYYY-MM-DD HH:mm:ss', true)
  let endTime = moment(query.endDateFilter || query.endDate, 'YYYY-MM-DD HH:mm:ss', true)
  let hourQuery = genHourMinuteBlock(startTime, endTime)

  let diffCheck = _.difference(hourQuery, resultName)
  diffCheck.forEach(function (item) {
    result.push(initDataRow(item, 0))
  })

  data.recordset = _.sortBy(result, 'name');

  rowTotal.Efficiency = (rowTotal.ReceivedCall - rowTotal.AbdIn15s)
    ? parseFloat(rowTotal.ServedCall / (rowTotal.ReceivedCall - rowTotal.AbdIn15s) * 100).toFixed(2)
    : 0;
  rowTotal.totalWaitTimeQueue = roundAvg(rowTotal.ReceivedCall ? (rowTotal.totalWaitTimeQueue / rowTotal.ReceivedCall) : 0);
  rowTotal.totalDuarationHandling = roundAvg(rowTotal.ServedCall ? (rowTotal.totalDuarationHandling / rowTotal.ServedCall) : 0);
  rowTotal.MaxNumSimultaneousCall = result ? _.max(result, (result) => result.MaxNumSimultaneousCall).MaxNumSimultaneousCall : 0
  rowTotal.LongestWaitingTime = result ? _.max(result, (result) => result.LongestWaitingTime).LongestWaitingTime : 0
  data.rowTotal = rowTotal;
  return data;
}
/**
 * Lấy tất cả các khoảng thời gian theo query
 * @param {string} startTime Thời gian bắt đầu
 * @param {string} endTime Thời gian kết thúc
 */

function genHourMinuteBlock(startTime, endTime) {
  var hour = []
  while (endTime > startTime) {
    hour.push(`${startTime.format("HH:mm")}-${startTime.add(15, "m").format('HH:mm')}`);
  }
  return _.uniq(hour);

}

/**
 * 
 * *** Mô tả comment *********************************
 * *** Ngày: 2020-12-18
 * *** Dev: hainv
 * *** Lý do:
 * request change: a DũngNĐ - BHS muốn các cuộc có: cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.Other) thì vào ABD, sẽ tính < 15s hoặc > 15s tùy thuộc vào waitTimeQueue
 * 
 * *** Cách khắc phục duplicated:
 * 
 * @param {object} pre 
 * @param {object} cur 
 */
function handleReduceFunc(pre, cur) {
  // Thời gian chờ: abandon waiting time trong queue;
  // let waitTimeQueue = cur.Duration - cur.TalkTime;
  let { waitTimeQueue, waitTimeAnwser } = cur;

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissIVR)) pre.StopIVR++;

  if (cur.CallTypeTXT != reasonToTelehub(TYPE_MISSCALL.MissIVR)){
    pre.ReceivedCall++;
    pre.totalWaitTimeQueue += waitTimeQueue || 0;

    if (waitTimeQueue > pre.LongestWaitingTime)
      pre.LongestWaitingTime = waitTimeQueue;
  }

  if (cur.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)) {
    pre.ServedCall++;
    pre.totalDuarationHandling += cur.TalkTime + cur.HoldTime;

    
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
    || (cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.Other)) // && cur.CallDisposition == 1 =1 Lỗi mạng
  ) {
    if (waitTimeQueue <= 15) {
      pre.AbdIn15s++;
    }
    if (waitTimeQueue > 15) {
      pre.AbdAfter15s++;

    }
  }

  if(cur.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.Other)){
    console.log("CallTypeTXT Other, cur.CallDisposition", cur.CallDisposition, `waitTimeQueue=${waitTimeQueue}`);
  }
  return pre;
}

function initDataRow(name, Inbound) {
  return {
    name,
    Inbound,
    StopIVR: 0,
    ReceivedCall: 0,
    ServedCall: 0,
    MissCall: 0,
    Aband: 0,
    AbdCall: 0,
    AbdIn15s: 0,
    AbdAfter15s: 0,
    Efficiency: 0,
    totalDuarationHandling: 0,
    MaxNumSimultaneousCall: 0,
    avgTimeWaiting: 0,
    avgHandlingTime: 0,
    LongestWaitingTime: 0,
    totalWaitTimeQueue: 0, // tổng thời gian chờ trong queue
  };
}

function mappingACDSummary(data, query) {
  let { recordset } = data;

  let { startDate, endDate } = query;
  startDate = moment(startDate, "YYYY-MM-DD HH:mm:ss", true);
  endDate = moment(endDate, "YYYY-MM-DD HH:mm:ss", true);

  let days = genDays(startDate, endDate);

  let groupByDayMonthBlock = _.groupBy(recordset, "DayMonthBlock");

  // data vẽ table
  let result = [];

  // giá trị dòng SUMMARY
  let rowTotal = initDataRow("SUMMARY", 0);

  let { skillGroups } = query;
  if (skillGroups) skillGroups = skillGroups.split(",");

  days.forEach((item) => {

    let dataFound = Object.keys(groupByDayMonthBlock).find(i => item == i);

    let element = dataFound ? groupByDayMonthBlock[dataFound] : [];

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
    reduceTemp.avgTimeWaiting = roundAvg(reduceTemp.ReceivedCall ?
     (
      reduceTemp.totalWaitTimeQueue / reduceTemp.ReceivedCall
    ) : 0);

    reduceTemp.avgHandlingTime = roundAvg(reduceTemp.ServedCall ?
     (
      reduceTemp.totalDuarationHandling / reduceTemp.ServedCall
    ) : 0);
    reduceTemp.Efficiency = (reduceTemp.ReceivedCall - reduceTemp.AbdIn15s)
      ? reduceTemp.ServedCall /
      (reduceTemp.ReceivedCall - reduceTemp.AbdIn15s)
      : 0;

    reduceTemp.LongestWaitingTime = (reduceTemp.LongestWaitingTime);
    let countByMinuteTime = _.countBy(element, "MinuteTimeBlock");
    let maxInMinuteTime = _.max(
      Object.keys(countByMinuteTime).map((i) => countByMinuteTime[i])
    );
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
    rowTotal.totalWaitTimeQueue += reduceTemp.totalWaitTimeQueue
    rowTotal.totalDuarationHandling += reduceTemp.totalDuarationHandling
  });


  data.recordset = result;
  rowTotal.Aband = rowTotal.ReceivedCall ?
    rowTotal.AbdCall / rowTotal.ReceivedCall * 100 : 0

  // rowTotal.totalWaitTimeQueue = rowTotal.ReceivedCall ? hms(rowTotal.totalWaitTimeQueue / rowTotal.ReceivedCall) : 0
  // rowTotal.totalDuarationHandling = rowTotal.ServedCall ? hms(rowTotal.totalDuarationHandling / rowTotal.ServedCall) : 0
  // rowTotal.LongestWaitingTime = result ? _.max(result, function (result) { return hmsToNumber(result.LongestWaitingTime); }).LongestWaitingTime : 0

  rowTotal.totalWaitTimeQueue = roundAvg(rowTotal.ReceivedCall ? (rowTotal.totalWaitTimeQueue / rowTotal.ReceivedCall) : 0);
  rowTotal.totalDuarationHandling = roundAvg(rowTotal.ServedCall ? (rowTotal.totalDuarationHandling / rowTotal.ServedCall) : 0);
  rowTotal.LongestWaitingTime = result ? _.max(result, (result) => result.LongestWaitingTime).LongestWaitingTime : 0

  rowTotal.Efficiency = (rowTotal.ReceivedCall - rowTotal.AbdIn15s)
    ? rowTotal.ServedCall / (rowTotal.ReceivedCall - rowTotal.AbdIn15s) * 100
    : 0;

  data.rowTotal = rowTotal;

  return data;
}

/**
  {
    name: '01/11',
    1900: {
      total: 100,
      north_call: 60,
      south_call: 40,
      
      north_percent: '60 %',
      south_percent: '40 %',
    },
    1800: {
      total: 100,
      north_call: 60,
      south_call: 40,
      
      north_percent: '60 %',
      south_percent: '40 %',
    }
  }
  
  */
function mappingStatistic(
  { doc1900, doc1800, docMB1900, docMB1800 },
  { callType, callTypeMB, callType1800, callTypeMB1800 }
) {
  // tạo dòng MTD (month to date) mặc định
  let rowMTD = {
    name: "MTD",
    1900: {
      total: 0,
      north_call: 0,
      south_call: 0,

      north_percent: "",
      south_percent: "",
    },
  };
  let result = [];

  let result1900 = getDataStatistic(doc1900, docMB1900);
  let result1800 = getDataStatistic(doc1800, docMB1800);

  let allDays = _.union(
    _.pluck(result1900, "name"),
    _.pluck(docMB1900, "name"),
    _.pluck(result1800, "name"),
    _.pluck(docMB1800, "name")
  );

  // item = 01/11
  allDays.forEach((item) => {
    let temp = {
      name: item,
    };
    let _1900Found = result1900.find((i) => i.name === item);
    let _1800Found = result1800.find((i) => i.name === item);

    if (_1900Found) {
      temp["1900"] = Object.assign({}, _1900Found);
      Object.keys(_1900Found).forEach((i) => {
        let element = _1900Found[i];
        if (!["name", "north_percent", "south_percent"].includes(i)) {
          // Tính tổng các ngày vào Month To Date
          rowMTD["1900"][i] += element;
        }
      });
      rowMTD["1900"]["north_percent"] = percentFormat(
        rowMTD["1900"]["north_call"],
        rowMTD["1900"]["total"]
      );
      rowMTD["1900"]["south_percent"] = percentFormat(
        rowMTD["1900"]["south_call"],
        rowMTD["1900"]["total"]
      );

      delete temp["1900"].name;
    }

    if (_1800Found) {
      rowMTD["1800"] = {
        total: 0,
        north_call: 0,
        south_call: 0,

        north_percent: "",
        south_percent: "",
      };

      temp["1800"] = Object.assign({}, _1800Found);

      Object.keys(_1800Found).forEach((i) => {
        let element = _1800Found[i];
        if (!["name", "north_percent", "south_percent"].includes(i)) {
          // Tính tổng các ngày vào Month To Date
          rowMTD["1800"][i] += element;
        }
      });

      rowMTD["1800"]["north_percent"] = percentFormat(
        rowMTD["1800"]["north_call"],
        rowMTD["1800"]["total"]
      );
      rowMTD["1800"]["south_percent"] = percentFormat(
        rowMTD["1800"]["south_call"],
        rowMTD["1800"]["total"]
      );

      delete temp["1800"].name;
    }

    result.push(temp);
  });

  return [rowMTD, ...result];
}

/**
 * Lấy dữ liệu của miền bắc & miền nam group theo ngày
 * @param {Object} dataMN dữ liệu miền nam
 * @param {Object} dataMB dữ liệu miền bắc
 */
function getDataStatistic(dataMN, dataMB) {
  let countByMN = _.countBy(dataMN, "DayMonthBlock");
  let countByMB = _.countBy(dataMB, "DayMonthBlock");
  let allDay = [...Object.keys(countByMN), ...Object.keys(countByMB)];
  let result = [];

  allDay.sort().forEach((i, index) => {
    let temp = {
      name: i,
      total: 0,
      north_call: 0,
      south_call: 0,

      north_percent: "",
      south_percent: "",
    };

    if (countByMN[i]) {
      temp.total += countByMN[i];
      temp.south_call += countByMN[i];
    }

    if (countByMB[i]) {
      temp.total += countByMB[i];
      temp.north_call += countByMB[i];
    }

    temp.north_percent = percentFormat(temp.north_call, temp.total);
    temp.south_percent = percentFormat(temp.south_call, temp.total);

    result.push(temp);
  });

  return result;
}

function genDays(startDate, endDate) {
  const days = [];
  while (endDate >= startDate) {
    days.push(startDate.format("DD/MM"));
    startDate.add(1, "days");
  }
  return days;
}
