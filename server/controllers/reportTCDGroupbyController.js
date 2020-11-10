/**
 * require Model
 */
const _model = require("../models/reportTCDGroupbyModal");
const _modelReportCustomizeModal = require("../models/reportCustomizeModal");
const _callTypeModel = require("../models/reportTCDCallTypeAgentDetailModal");
const _baseModel = require("../models/baseModel");

/**
 * require Controller
 */
const base = require("./baseController");

/**
 * require Helpers
 */

const {
  FIELD_AGENT,
  SUCCESS_200,
  ERR_400,
  ERR_404,
  ERR_500,
  TYPE_MISSCALL,
  TYPE_CALL_HANDLE,
} = require("../helpers/constants");
const { reasonToTelehub, sumByKey } = require("../helpers/functions");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

exports.callDisposition = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (query.callDisposition)
      query.callDisposition = query.callDisposition.split(",");
    else query.callDisposition = [19, 3, 60, 7];

    if (!query.startDate || !query.endDate || !query.callTypeID)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    const doc = await _model.callDisposition(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Ko dùng được @@
 */
exports.skillGroup = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (query.skillGroup) query.skillGroup = query.skillGroup.split(",");
    else query.skillGroup = [19, 3, 60, 7];

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    const doc = await _model.skillGroup(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Query dữ liệu chi tiết rồi tự group tay
 * API lấy dữ liệu chi tiết cuộc gọi nhỡ
 * Trang telehub: BÁO CÁO GỌI VÀO - CUỘC GỌI BỊ NHỠ THEO KHÁCH HÀNG: Tìm kiếm tổng quát
 */
exports.skillGroupMapping = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;
    query.rawData = true;
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

    const doc = await _callTypeModel.missCallByCustomer(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res
      .status(SUCCESS_200.code)
      .json({ data: misscallGroupbySkillGroup(doc, query) });
  } catch (error) {
    next(error);
  }
};

/**
 * Report 20 - 80 của GGG
 */
exports.byQueueMapping = async (req, res, next) => {
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
      .json({ data: mappingReportByQueue(doc, query) });
  } catch (error) {
    next(error);
  }
};

function mappingReportByQueue(data, query) {
  let { recordset } = data;

  // bỏ các bản tin Miss IVR
  recordset = recordset.filter((i) => i.SkillGroupSkillTargetID !== null);

  let groupBySkillGroup = _.groupBy(recordset, "EnterpriseName");

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

  Object.keys(groupBySkillGroup).sort().forEach((item) => {
    let element = groupBySkillGroup[item];
    let temp = {};
    let filterIVR = element.filter(
      (i) => i.CallTypeTXT == reasonToTelehub(TYPE_MISSCALL.MissIVR)
    );

    let filterCallHandled = element.filter(
      (i) => i.CallTypeTXT == reasonToTelehub(TYPE_CALL_HANDLE)
    );

    let totalDuration =
      sumByKey(element, "Duration") - sumByKey(filterIVR, "Duration");

    // handle data mapping for report telehub
    temp._id = element[0].SkillGroupSkillTargetID;
    temp.EnterpriseName = item;
    temp.totalCall = element.length - filterIVR.length;
    temp.connected = filterCallHandled.length;
    // element.missed = element.routerCallsAbandQ;
    temp.callDuration = totalDuration * 1000;

    result.push(temp);
  });
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

function misscallGroupbySkillGroup(data, query) {
  let { recordset } = data;
  recordset = recordset.map((i) => {
    if (i.SkillGroupSkillTargetID === null) i.SkillGroupSkillTargetID = "IVR";
    return i;
  });
  let groupBySkillGroup = _.groupBy(recordset, "SkillGroupSkillTargetID");

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

  Object.keys(groupBySkillGroup).forEach((item) => {
    let element = groupBySkillGroup[item];
    let temp = {};
    let filterIVR = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissIVR)
    );
    let filterCustomerEndRinging = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)
    );
    let filterMissAgent = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissAgent)
    );
    let filterRejectByAgent = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.RejectByAgent)
    );
    let filterMissQueue = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissQueue)
    );
    let filterMissShortCall = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissShortCall)
    );
    let filterOther = element.filter(
      (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.Other)
    );
    let caculatorDuration = function (data) {
      return data.reduce((pre, cur) => pre + cur.Duration, 0);
    };
    if (item == "IVR") {
      temp = initObjectMapping(CT_IVR, "IVR");
      temp[`type_${TYPE_MISSCALL.MissIVR.value}`] = filterIVR.length;
      // temp[`type_${TYPE_MISSCALL.MissQueue.value}`] = filterMissQueue.length;
      // temp[`type_${TYPE_MISSCALL.Other.value}`] = filterOther.length;
      // do phía telehub fix cứng vậy -_-
      // temp[`type_other`] = filterOther.length;
      temp.totalDur =
        caculatorDuration(filterIVR) *
        // + caculatorDuration(filterOther)
        // + caculatorDuration(filterMissQueue)
        1000;
      temp.total = filterIVR.length; // + filterMissQueue.length;
      temp.avgDur = temp.total == 0 ? 0 : temp.totalDur / temp.total;

      if (
        skillGroups &&
        skillGroups.filter((i) => i.includes("CT")).length == 0 &&
        filterIVR.length == 0
      )
        return;
    } else {
      temp = initObjectMapping(item, element[0].EnterpriseName);
      temp[`type_${TYPE_MISSCALL.CustomerEndRinging.value}`] =
        filterCustomerEndRinging.length;
      temp[`type_${TYPE_MISSCALL.MissAgent.value}`] = filterMissAgent.length;
      temp[`type_${TYPE_MISSCALL.RejectByAgent.value}`] =
        filterRejectByAgent.length;
      temp[`type_${TYPE_MISSCALL.MissQueue.value}`] = filterMissQueue.length;
      temp[`type_${TYPE_MISSCALL.MissShortCall.value}`] =
        filterMissShortCall.length;
      // temp[`type_${TYPE_MISSCALL.Other.value}`] = filterOther.length;
      // do phía telehub fix cứng vậy -_-
      temp[`type_other`] = filterOther.length;
      let totalDuration =
        caculatorDuration(filterCustomerEndRinging) +
        caculatorDuration(filterMissAgent) +
        caculatorDuration(filterRejectByAgent) +
        caculatorDuration(filterMissQueue) +
        caculatorDuration(filterMissShortCall) +
        caculatorDuration(filterOther);
      temp.totalDur = totalDuration * 1000;
      temp.total = element.length;
      temp.avgDur = (totalDuration * 1000) / temp.total;
    }
    result.push(temp);
  });
  data.recordset = result;
  return data;
}

function increaseObject(_resultElement, item, index, _data) {
  switch (item.MissReason) {
    case reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging):
      _resultElement[`type_${TYPE_MISSCALL.CustomerEndRinging.value}`] += 1;
      break;
    case reasonToTelehub(TYPE_MISSCALL.MissAgent):
      _resultElement[`type_${TYPE_MISSCALL.MissAgent.value}`] += 1;
      break;
    case reasonToTelehub(TYPE_MISSCALL.MissQueue):
      _resultElement[`type_${TYPE_MISSCALL.MissQueue.value}`] += 1;
      break;
    case reasonToTelehub(TYPE_MISSCALL.RejectByAgent):
      _resultElement[`type_${TYPE_MISSCALL.RejectByAgent.value}`] += 1;
      break;
    default:
      _resultElement[`type_other`] += 1;
      break;
  }
  if (item.EnterpriseName) _resultElement.name = item.EnterpriseName;

  _resultElement.total += 1;
  _resultElement.totalDur += item.Duration * 1000;

  // phan tu cuoi cung
  if (index == _data.length - 1) {
    _resultElement.avgDur = _resultElement.totalDur / _resultElement.total;
  }

  return _resultElement;
}

function initObjectMapping(id, name) {
  return {
    _id: id,
    name: name,
    type_1: 0, //
    type_2: 0, //
    type_3: 0, //
    type_4: 0, //
    type_5: 0, //
    type_8: 0, //
    type_1_dur: 0,
    type_2_dur: 0,
    type_3_dur: 0,
    type_4_dur: 0,
    type_5_dur: 0,
    type_8_dur: 0,
    type_other: 0,
    total: 0,
    totalDur: 0,
    avgDur: 0,
  };
}
