/**
 * require Model
 */
const _model = require("../models/reportTCDOutboundModel");
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


const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

exports.reportOutboundAgent = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;
    console.log(query);

    if (!query.startDate || !query.endDate)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    if (!query.Agent_Team || query.Agent_Team == '')
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    // for (let i = 0; i < Object.keys(query).length; i++) {
    //   const item = Object.keys(query)[i];
    //   // const element = query[item];
    //   if (item.includes("CT_ToAgentGroup")) {
    //     let groupNumber = item.replace("CT_ToAgentGroup", "");

    //     if (!query[`CT_Queue${groupNumber}`]) {
    //       return next(
    //         new ResError(
    //           ERR_400.code,
    //           `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
    //         ),
    //         req,
    //         res,
    //         next
    //       );
    //     }
    //   }
    // }

    const doc = await _model.reportOutboundAgent(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

exports.reportOutboundAgentProductivity = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    if (!req.query || !req.query.agentTeamId || req.query.agentTeamId == '') {
      return next(new ResError(ERR_400.code, 'agentTeamId không được để trống!'));
    }

    let query = req.query;

    const doc = await _model.reportOutboundAgentProductivity(db, dbMssql, query);
    if (!doc) {
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    }

    return res.status(SUCCESS_200.code).json({ data: doc.recordset });
  } catch (error) {
    console.log(`------- error ------- reportOutboundAgent`);
    console.log(error);
    console.log(`------- error ------- reportOutboundAgent`);
    next(error);
  }
};

exports.reportOutboundOverallProductivityByAgent = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    if (!req.query || !req.query.agentTeamId || req.query.agentTeamId == '') {
      return next(new ResError(ERR_400.code, 'Trường agentTeamId không được để trống!'));
    }

    let query = req.query;

    const doc = await _model.reportOutboundOverallProductivityByAgent(db, dbMssql, query);
    if (!doc) {
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    }

    return res.status(SUCCESS_200.code).json({ data: doc.recordset });
  } catch (error) {
    console.error(`------- error ------- reportOutboundOverallProductivityByAgent`);
    console.error(error);
    console.error(`------- error ------- reportOutboundOverallProductivityByAgent`);
  }
}

exports.reportOutboundAgentProductivityDetail = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    if (!req.query || !req.query.agentTeamId || req.query.agentTeamId == '') {
      return next(new ResError(ERR_400.code, 'agentTeamId không được để trống!'));
    }

    let query = req.query;

    let page = query.page ? parseInt(query.page) : 1;
    let limit = 10;
    let totalRows = 0;
    let totalPage = 1;
    let skip = (page - 1) * limit;

    const sumRowsResult = await _model.countNumRowsTCD(db, dbMssql, query);
    totalRows = sumRowsResult.recordset[0].numRows;

    query.limit = limit;
    query.skip = skip;

    const doc = await _model.reportOutboundOverallProductivityDetail(db, dbMssql, query);
    if (!doc) {
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    }

    if(doc.recordset.length > 0) {
      totalPage = Math.ceil(totalRows / limit);
    }

    return res.status(SUCCESS_200.code).json({
      data: doc.recordset,
      totalRows: Number(totalRows),
      totalPage: Number(totalPage),
      page: Number(page)
    });
  } catch (error) {
    console.log(`------- error ------- reportOutboundAgent`);
    console.log(error);
    console.log(`------- error ------- reportOutboundAgent`);
    next(error);
  }
};

exports.reportOutboundByTime = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    if (!req.query || !req.query.agentTeamId || req.query.agentTeamId == '') {
      return next(new ResError(ERR_400.code, 'Trường agentTeamId không được để trống!'));
    }

    let query = req.query;

    const doc = await _model.reportOutboundByTime(db, dbMssql, query);
    if (!doc) {
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    }

    return res.status(SUCCESS_200.code).json({ data: doc.recordset });
  } catch (error) {
    console.error(`------- error ------- reportOutboundByTime`);
    console.error(error);
    console.error(`------- error ------- reportOutboundByTime`);
  }
}