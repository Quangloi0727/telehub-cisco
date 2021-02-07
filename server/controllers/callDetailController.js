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
const _model = require("../models/callDetailModal");

/**
 * require Utils
 */
const ResError = require('../utils/resError');

exports.handleByAgent = async (req, res, next) => {
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

        const doc = await _model.lastTCDRecordAdvanced(db, dbMssql, query);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {

            // lấy ra các giá trị của trường CallGUIDCustomize
            var arrCallGUID = _.pluck(doc.recordset, 'CallGUIDCustomize')

            let { url, customerReviews, token } = _config["cisco-gateway"];

            const options = {
                method: "post",
                body: JSON.stringify({
                    startDate: query.startDate,
                    endDate: query.endDate,
                    CallGUIDCustomize: arrCallGUID,
                    ternalID: query.ternalID
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-access-token": token,
                },
            };

            const result = await fetch(
                url + customerReviews, options
            ).then((res) => {
                return res.json();
            });

            if (!result.result) {
                return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
            } else {
                // gộp 2 kết quả dựa theo trường CallGUIDCustomize để lấy code(thông tin đánh giá khách hàng)
                let mergeArray = _.map(doc.recordset, function (r1) {
                    var r3 = {};
                    if (result.result.length > 0) {
                        _.map(result.result, function (r2) {
                            if (r1.CallGUIDCustomize == r2.CallGUIDCustomize) {
                                r3 = _.extend(r1, r2);
                            } else {
                                r3 = _.extend(r1, {});
                            }
                        })
                    } else {
                        r3 = _.extend(r1, {});
                    }
                    return r3
                });
                
                res
                    .status(SUCCESS_200.code)
                    .json({ data: mergeArray, startDate: query.startDate, endDate: query.endDate });
            }
        }
    } catch (error) {
        next(error);
    }
};