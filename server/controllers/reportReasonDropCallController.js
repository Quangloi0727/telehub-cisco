/**
 * require Model
 */
const _model = require("../models/reportReasonDropCallModal");
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

exports.getReportReasonDropCall = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;

        let query = req.query;
        query.pages = Number(query.pages) || 1;
        query.paging = query.paging ? Number(query.paging) : 0;
        query.download = query.download ? Number(query.download) : 0;
        query.rows = Number(query.rows) || Number(process.env.LIMIT_DOCUMENT_PAGE);
        if (query.duration_g) query.duration_g = query.duration_g.split(",");
        if (query.wait_g) query.wait_g = query.wait_g.split(",");

        if (
            query.pages <= 0 ||
            query.rows <= 0
        )
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        if (!query.startDate || !query.endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        for (let i = 0; i < Object.keys(query).length; i++) {
            const item = Object.keys(query)[i];
            // const element = query[item];
            if (item.includes("CT_ToAgentGroup")) {
                let groupNumber = item.replace("CT_ToAgentGroup", "");

                if (!query[`CT_Queue${groupNumber}`]) {
                    return next(
                        new ResError(
                            ERR_400.code,
                            `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
                        ),
                        req,
                        res,
                        next
                    );
                }
            }
        }

        const doc = await _model.getReportReasonDropCall(db, dbMssql, query);

        if (!doc)
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        res.status(SUCCESS_200.code).json({ data: doc });
    } catch (error) {
        next(error);
    }
};

