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
    TYPE_MISSCALL
} = require("../helpers/constants");
const { 
    reasonToTelehub
} = require("../helpers/functions");

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
  recordset = recordset.map(i => {
    if(i.SkillGroupSkillTargetID === null) i.SkillGroupSkillTargetID = "IVR";
    return i;
  })
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
    pages,
    rows,
    paging,
    download,
    rawData,
  } = query;

  Object.keys(groupBySkillGroup).forEach((item) => {
    let element = groupBySkillGroup[item];
    let temp = {};
    let filterIVR = element.filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissIVR));
    let filterCustomerEndRinging = element.filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.CustomerEndRinging));
    let filterMissAgent = element.filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissAgent));
    let filterRejectByAgent = element.filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.RejectByAgent));
    let filterMissQueue = element.filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissQueue));
    let filterOther = element.filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.Other));
    let caculatorDuration = function (data) {
        return data.reduce((pre, cur) => (pre + cur.Duration), 0);
    }
    if(item == "IVR"){
        temp = initObjectMapping(CT_IVR, "IVR");
        temp[`type_${TYPE_MISSCALL.MissIVR.value}`] = filterIVR.length;
        temp[`type_${TYPE_MISSCALL.MissQueue.value}`] = filterMissQueue.length;
         // temp[`type_${TYPE_MISSCALL.Other.value}`] = filterOther.length;
        // do phía telehub fix cứng vậy -_-
        temp[`type_other`] = filterOther.length;
        temp.totalDur = (caculatorDuration(filterIVR)
        + caculatorDuration(filterOther)
        + caculatorDuration(filterMissQueue))*1000;
        temp.total = filterIVR.length + filterOther.length + filterMissQueue.length;
        temp.avgDur = temp.totalDur/temp.total;
    }else{
        temp = initObjectMapping(item, element[0].EnterpriseName);
        // let missQueueIVR = [];
        // if(groupBySkillGroup["IVR"]){
        //     missQueueIVR = groupBySkillGroup["IVR"].filter(i => i.MissReason == reasonToTelehub(TYPE_MISSCALL.MissQueue));
        // }


        temp[`type_${TYPE_MISSCALL.CustomerEndRinging.value}`] = filterCustomerEndRinging.length;
        temp[`type_${TYPE_MISSCALL.MissAgent.value}`] = filterMissAgent.length;
        temp[`type_${TYPE_MISSCALL.RejectByAgent.value}`] = filterRejectByAgent.length;
        temp[`type_${TYPE_MISSCALL.MissQueue.value}`] = filterMissQueue.length;// + missQueueIVR.length;
        // temp[`type_${TYPE_MISSCALL.Other.value}`] = filterOther.length;
        // do phía telehub fix cứng vậy -_-
        temp[`type_other`] = filterOther.length;
        let totalDuration = caculatorDuration(filterCustomerEndRinging) + 
        caculatorDuration(filterMissAgent) + 
        caculatorDuration(filterRejectByAgent) + 
        caculatorDuration(filterMissQueue) + 
        caculatorDuration(filterOther) 
        // + caculatorDuration(missQueueIVR);
        temp.totalDur = totalDuration*1000;
        temp.avgDur = totalDuration*1000/(element.length);
        temp.total = element.length;// + missQueueIVR.length;

    }
    result.push(temp);

  });
  data.recordset = result;
  return data;
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
