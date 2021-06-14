const _model = require("../models/reportLoginLogout");
const { SUCCESS_200, ERR_500 } = require("../helpers/constants/statusCodeHTTP");
const ResError = require("../utils/resError");

exports.reportLoginLogout = async (req, res, next) => {
  try {
    const { db, dbMssql } = req.app.locals;
    const { startTime, endTime, type, agents, agentTeams } = req.query;

    if (!startTime) throw new Error('Thiếu trường startTime');

    if (!endTime) throw new Error('Thiếu trường endTime');

    if (!type) throw new Error('Thiếu trường type');

    if (!agentTeams) throw new Error('Thiếu trường agentTeams');

    const dataResult = await _model.reportLoginLogout(db, dbMssql, req.query);

    if (!dataResult) throw new Error('Not Found');

    return res.status(SUCCESS_200.code).json({ data: dataResult.recordset });
  } catch (error) {
    return next(new ResError(ERR_500.code, error.message ? error.message : error), req, res, next);
  }
};