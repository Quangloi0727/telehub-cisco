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

/**
 * API này có chức năng lấy ra các trạng thái và thời gian login logout của agent
 * Vì sao có API này:
 * - API này được dựa trên API 'report-login-logout'
 * - Vì có một số dự án yêu cầu lấy ra các loại Status khác nhau như:
 *    + AtLunch
 *    + Meeting
 *    + NoACD
 *    + NoAvailable
 *    + Not Ready
 *    + Training
 *    + Xu Ly Phieu
 * - Vì vậy API này được tạo ra để nhằm đáp ứng nhu cầu của khách hàng
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.reportChangeStatus = async (req, res, next) => {
  try {
    const { dbMssql } = req.app.locals;
    const { type, startTime, endTime, agentTeams } = req.query;

    if (!type) throw new Error('Thiếu trường type');

    if (!startTime) throw new Error('Thiếu trường startTime');

    if (!endTime) throw new Error('Thiếu trường endTime');

    if (!agentTeams) throw new Error('Thiếu trường agentTeams');

    const dataResult = await _model.reportChangeStatus(dbMssql, req.query);

    if (!dataResult) throw new Error('Not Found');

    return res.status(SUCCESS_200.code).json({ data: dataResult.recordset });
  } catch (error) {
    return next(new ResError(ERR_500.code, error.message ? error.message : error), req, res, next);
  }
};