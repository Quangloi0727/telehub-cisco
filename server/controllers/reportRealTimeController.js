/**
 * require Model
 */
const _model = require("../models/reportRealTimeModel");
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
} = require("../helpers/constants/statusCodeHTTP");

const { FIELD_AGENT } = require("../helpers/constants");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

// exports.getAll = async (req, res, next) => {
//   try {
//     let db = req.app.locals.db;
//     let dbMssql = req.app.locals.dbMssql;

//     let query = req.query;

//     if (
//       !query.startDate ||
//       !query.endDate ||
//       !query.CT_ToAgentGroup1 ||
//       !query.CT_ToAgentGroup2 ||
//       !query.CT_ToAgentGroup3
//     )
//       return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

//     const doc = await _model.getAll(db, dbMssql, query);

//     if (!doc)
//       return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
//     // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
//     res.status(SUCCESS_200.code).json({ data: doc });
//   } catch (error) {
//     next(error);
//   }
// };

/**
 * Lấy dữ liệu trong bảng TCD - [ins1_hds].[dbo].[t_Termination_Call_Detail]
 * - bản tin TCD cuối cùng của cuộc gọi
 */
exports.agentTeam = async (req, res, next) => {
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
    if (!query[`Agent_Team`]) {
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} Agent_Team`
        ),
        req,
        res,
        next
      );
    }
    const doc = await _model.agentTeam(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: groupAgentState(doc) });
  } catch (error) {
    next(error);
  }
};
/**
 * Lấy trạng thái của agent trong bảng - [ins1_awdb].[dbo].[t_Agent_Real_Time]
 */
exports.getStatusAgent = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let body = req.body;

    /**
     * Check việc truyền idAgentCisco và loại kênh
     */
    if (!body[`PeripheralNumber`]) {
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} PeripheralNumber`
        ),
        req,
        res,
        next
      );
    }
    if (_.has(body, 'PeripheralNumber') && body.PeripheralNumber.length == 0) {
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.inValid}`
        ),
        req,
        res,
        next
      );
    }
    if (!body[`MRDomainID`]) {
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} MRDomainID`
        ),
        req,
        res,
        next
      );
    }
    const doc = await _model.getStatusAgent(db, dbMssql, body);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

/**
 * Group cho report real time ở doadboard kplus:
 * Tính trạng thái agent:
 * - Ready
 * - Not Ready
 * - ...
 * - Talking
 */

function groupAgentState(data) {
  let { recordset } = data;
  console.log("groupby groupAgentState", recordset);
  let result = initRowStateAgent();

  let countByReasonTextTelehub = _.countBy(recordset, "ReasonTextTelehub");
  console.log(countByReasonTextTelehub);

  Object.keys(countByReasonTextTelehub).forEach(i => {
    result[i] = countByReasonTextTelehub[i];
  });

  // fake data de test :D 
  // data.recordset = { Ready: 11, 'Not Ready': 6, 'At Lunch': 5, "Meeting": 11, "Talking": 98 };
  data.recordset = result;
  return data;
}

function initRowStateAgent() {
  return { Ready: 0, 'Not Ready': 0, 'At Lunch': 0, "Meeting": 0, "Talking": 0 };
}
