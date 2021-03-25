const { Logger } = require("mongodb");
const fetch = require("node-fetch");
const {
    SUCCESS_200,
    ERR_400,
    ERR_404,
    ERR_500,
    FIELD_AGENT,
    TYPE_MISSCALL,
    TYPE_CALL_HANDLE,
} = require("../helpers/constants");

/**
 * require Model
 */
const _model = require("../models/reportRequestRecallModel");

/**
 * require Utils
 */
const ResError = require('../utils/resError');

exports.reportRequestRecall = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let query = req.query;

        if (!query.startDate || !query.endDate || !query.CT_IVR)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        /**
         * Check việc khởi tạo các CallType
         * nếu truyền thiếu sẽ ảnh hưởng tới việc tổng hợp báo cáo
        */
        for (let i = 0; i < Object.keys(query).length; i++) {
            const item = Object.keys(query)[i];
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

                if (!query[`SG_Voice_${groupNumber}`]) {
                    return next(
                        new ResError(
                            ERR_400.code,
                            `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
                        ),
                        req,
                        res,
                        next
                    );
                }
            }
        }

        const doc = await _model.lastTCDRecord(db, dbMssql, query);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc, pages: req.query.pages });
        }
    } catch (error) {
        next(error);
    }
};