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

    if (query.CT_ToAgentGroup1 && !query.CT_Queue1)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue1`
        ),
        req,
        res,
        next
      );
    if (query.CT_ToAgentGroup2 && !query.CT_Queue2)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue2`
        ),
        req,
        res,
        next
      );
    if (query.CT_ToAgentGroup3 && !query.CT_Queue3)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue3`
        ),
        req,
        res,
        next
      );

    const doc = await _model.report2080(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: mapping2080(doc, query) });
  } catch (error) {
    next(error);
  }
};

function mapping2080(data, query) {
  let { recordset } = data;

  let result = [];

  let {
    startDate,
    endDate,
    CT_IVR,
    CT_ToAgentGroup1,
    CT_ToAgentGroup2,
    CT_ToAgentGroup3,
    CT_Queue1,
    CT_Queue2,
    CT_Queue3,
    SG_Voice_1,
    SG_Voice_2,
    SG_Voice_3,
    pages,
    rows,
    paging,
    download,
    rawData,
    skillGroups,
  } = query;
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
          (RTCQueueHandle[0].result ? (RTCQueueHandle[0].result / RTCQueue[0].result) * 100 : 0).toFixed() +
            " %"
        )
      );
    else
      result.childs.push(
        rowData(
          i.name,
          `${RTCQueueHandle[index] ? RTCQueueHandle[index].result: ''} / ${RTCQueue[index].result}`,
          (RTCQueueHandle[index] ? (RTCQueueHandle[index].result/ RTCQueue[index].result)*
            100: 0).toFixed() + " %"
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
      i.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE) && (i.Duration - i.TalkTime) <= 20
  );
  let RTCQueueHandle = totalCallQueueHandle(data, query).childs;

  let countBySG = _.countBy(filterData, "EnterpriseName");

  // Total
  result.childs.push(
    rowData("Total", `${filterData.length} / ${RTCQueueHandle[0].result}`)
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
      i.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE) && (i.Duration - i.TalkTime)  >= 20
  );

  let RTCQueueHandle = totalCallQueueHandle(data, query).childs;

  let countBySG = _.countBy(filterData, "EnterpriseName");

  // Total
  result.childs.push(
    rowData("Total", `${filterData.length} / ${RTCQueueHandle[0].result}`)
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
