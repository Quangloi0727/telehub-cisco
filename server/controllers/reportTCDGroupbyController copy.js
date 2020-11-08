/**
 * require Model
 */
const _model = require("../models/reportTCDGroupbyModal");
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
} = require("../helpers/constants");
const { reasonToTelehub } = require("../helpers/functions");

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

function misscallGroupbySkillGroup(data, query) {
  let { recordset } = data;
  console.log({recordsetLength: recordset.length });
  
  let caculatorDuration = (d) => d.reduce((p, c) => p + c.Duration, 0);

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
  if(skillGroups) skillGroups = skillGroups.split(",");

  let filterIVR = recordset.filter((i) => i.CT_Type === "IVR");
  let filterQueue = recordset.filter((i) => i.CT_Type === "QUEUE");

  if(CT_ToAgentGroup1) CT_ToAgentGroup1 = Number(CT_ToAgentGroup1);
  if(CT_ToAgentGroup2) CT_ToAgentGroup2 = Number(CT_ToAgentGroup2);
  if(CT_ToAgentGroup3) CT_ToAgentGroup3 = Number(CT_ToAgentGroup3);
  
  if(CT_Queue1) CT_Queue1 = Number(CT_Queue1);
  if(CT_Queue2) CT_Queue2 = Number(CT_Queue2);
  if(CT_Queue3) CT_Queue3 = Number(CT_Queue3);

  if(SG_Voice_1) SG_Voice_1 = Number(SG_Voice_1);
  if(SG_Voice_2) SG_Voice_2 = Number(SG_Voice_2);
  if(SG_Voice_3) SG_Voice_3 = Number(SG_Voice_3);

  let tempIVR = initObjectMapping(CT_IVR, "IVR");
  tempIVR.totalDur = caculatorDuration(filterIVR) * 1000;
  tempIVR[`type_${TYPE_MISSCALL.MissIVR.value}`] = filterIVR.length;
  tempIVR.total = filterIVR.length; // + filterMissQueue.length;
  tempIVR.avgDur = tempIVR.total == 0 ? 0 : tempIVR.totalDur / tempIVR.total;
  if(skillGroups && skillGroups.length > 0 && skillGroups.filter((i) => i.includes("CT")).length > 0 && tempIVR.length > 0) result.push(tempIVR);
  console.log({SG: _.countBy(filterQueue, "SkillGroupSkillTargetID")});
  filterQueue.forEach((item, index) => {
    let resultFound = result.find(i => (i._id == item.SkillGroupSkillTargetID || (
      ([CT_Queue1].includes(item.CallTypeID) && i._id == SG_Voice_1) ||
      ([CT_Queue2].includes(item.CallTypeID) && i._id == SG_Voice_2) ||
      ([CT_Queue3].includes(item.CallTypeID) && i._id == SG_Voice_3)
      )
    ));

    if(!resultFound){
      if(!item.SkillGroupSkillTargetID){
        switch (item.CallTypeID) {
          case CT_Queue1:
            resultFound = initObjectMapping(SG_Voice_1, SG_Voice_Name_1);
            break;
          case CT_Queue2:
            resultFound = initObjectMapping(SG_Voice_2, SG_Voice_Name_2);
            break;
          case CT_Queue3:
            resultFound = initObjectMapping(SG_Voice_3, SG_Voice_Name_3);
            break;
        
          default:
            resultFound = initObjectMapping("SG_Not_Found", "SG_Not_Found");
            break;
        }
        
      }else {
        resultFound = initObjectMapping(item.SkillGroupSkillTargetID, item.EnterpriseName);
      }
      resultFound = increaseObject(resultFound, item, index, filterQueue);
      result.push(resultFound);

    }else {
      resultFound = increaseObject(resultFound, item, index, filterQueue);
      result = result.map(i => {
        if(i._id == resultFound._id) return resultFound;
        else return i;
      });
    }
   

    
  });

  // Object.keys(groupBySkillGroup).forEach((item) => {
  //   let element = groupBySkillGroup[item];
  //   let temp = {};
  //   let filterIVR = element.filter(
  //     (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissIVR)
  //   );
  //   let filterCustomerEndRinging = element.filter(
  //     (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging)
  //   );
  //   let filterMissAgent = element.filter(
  //     (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissAgent)
  //   );
  //   let filterRejectByAgent = element.filter(
  //     (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.RejectByAgent)
  //   );
  //   let filterMissQueue = element.filter(
  //     (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissQueue)
  //   );
  //   let filterOther = element.filter(
  //     (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.Other)
  //   );

  //   if (item == "MissQueue") {
  //     if()
  //     temp = initObjectMapping(CT_IVR, "IVR");
  //     temp[`type_${TYPE_MISSCALL.MissIVR.value}`] = filterIVR.length;
  //     // temp[`type_${TYPE_MISSCALL.MissQueue.value}`] = filterMissQueue.length;
  //     // temp[`type_${TYPE_MISSCALL.Other.value}`] = filterOther.length;
  //     // do phía telehub fix cứng vậy -_-
  //     // temp[`type_other`] = filterOther.length;
  //     temp.totalDur =
  //       caculatorDuration(filterIVR) *
  //       // + caculatorDuration(filterOther)
  //       // + caculatorDuration(filterMissQueue)
  //       1000;
  //     temp.total = filterIVR.length; // + filterMissQueue.length;
  //     temp.avgDur = temp.total == 0 ? 0 : temp.totalDur / temp.total;

  //     if (
  //       skillGroups &&
  //       skillGroups.split(",").filter((i) => i.includes("CT")).length == 0 &&
  //       filterIVR.length == 0
  //     )
  //       return;
  //   } else {
  //     temp = initObjectMapping(item, element[0].EnterpriseName);
  //     let missQueueIVR = [];
  //     let missOrtherIVR = [];
  //     if (groupBySkillGroup["IVR"]) {
  //       missQueueIVR = groupBySkillGroup["IVR"].filter(
  //         (i) =>
  //           i.MissReason ==
  //           reasonToTelehub(TYPE_MISSCALL.MissQueue) + `-${item}`
  //       );
  //       missOrtherIVR = groupBySkillGroup["IVR"].filter(
  //         (i) => i.MissReason == reasonToTelehub(TYPE_MISSCALL.Other)
  //       );
  //     }

  //     temp[`type_${TYPE_MISSCALL.CustomerEndRinging.value}`] =
  //       filterCustomerEndRinging.length;
  //     temp[`type_${TYPE_MISSCALL.MissAgent.value}`] = filterMissAgent.length;
  //     temp[`type_${TYPE_MISSCALL.RejectByAgent.value}`] =
  //       filterRejectByAgent.length;
  //     temp[`type_${TYPE_MISSCALL.MissQueue.value}`] =
  //       filterMissQueue.length + missQueueIVR.length;
  //     // temp[`type_${TYPE_MISSCALL.Other.value}`] = filterOther.length;
  //     // do phía telehub fix cứng vậy -_-
  //     temp[`type_other`] = filterOther.length + missOrtherIVR.length;
  //     let totalDuration =
  //       caculatorDuration(filterCustomerEndRinging) +
  //       caculatorDuration(filterMissAgent) +
  //       caculatorDuration(filterRejectByAgent) +
  //       caculatorDuration(filterMissQueue) +
  //       caculatorDuration(missQueueIVR) +
  //       caculatorDuration(missOrtherIVR) +
  //       caculatorDuration(filterOther);
  //     // + caculatorDuration(missQueueIVR);
  //     temp.totalDur = totalDuration * 1000;
  //     temp.total = element.length + missQueueIVR.length + missOrtherIVR.length;
  //     temp.avgDur = (totalDuration * 1000) / temp.total;
  //   }
  //   result.push(temp);
  // });
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
  if(item.EnterpriseName) _resultElement.name = item.EnterpriseName;

  _resultElement.total += 1;
  _resultElement.totalDur += item.Duration * 1000;

  
  // phan tu cuoi cung
  if(index == _data.length -1){
    _resultElement.avgDur = _resultElement.totalDur/_resultElement.total;
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
    type_1_dur: 0,
    type_2_dur: 0,
    type_3_dur: 0,
    type_4_dur: 0,
    type_5_dur: 0,
    type_other: 0,
    total: 0,
    totalDur: 0,
    avgDur: 0,
  };
}
