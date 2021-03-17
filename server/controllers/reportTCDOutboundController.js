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

  } catch (error) {

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