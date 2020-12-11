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
  let result = {};

  let countByReasonTextTelehub = _.countBy(recordset, "ReasonTextTelehub");
  console.log(countByReasonTextTelehub);

  result = countByReasonTextTelehub

  return result;
}
