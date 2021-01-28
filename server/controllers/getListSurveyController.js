/**
 * require Model
 */
const _model = require('../models/getListSurveyModel');
const _baseModel = require('../models/baseModel');

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

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

/**
 * Lấy dữ liệu trong bảng [ins1_awdb].[dbo].[t_Dialed_Number]
 * - bản tin TCD cuối cùng của cuộc gọi
 */
exports.getSurveyByPrefix = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;

        let query = req.query;

        // if (!query.startDate || !query.endDate || !query.CT_IVR)
        //   return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        /**
         * Check Prefix
         * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
         */
        if (!query[`Prefix`]) {
            return next(
                new ResError(
                    ERR_400.code,
                    `${ERR_400.message_detail.missingKey} Prefix`
                ),
                req,
                res,
                next
            );
        }
        const doc = await _model.getSurveyByPrefix(db, dbMssql, query);

        if (!doc)
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        res.status(SUCCESS_200.code).json({ data: lstDialedNumberString(doc) });
    } catch (error) {
        next(error);
    }
};

function lstDialedNumberString(data) {
    let { recordset } = data;
    let result = [];
    let countByDialedNumberString = _.countBy(recordset, "DialedNumberString");
    console.log(countByDialedNumberString);
    result = Object.keys(countByDialedNumberString)
    data.recordset = result;
    return data;
}