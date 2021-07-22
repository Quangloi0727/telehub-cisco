const fetch = require("node-fetch");
/**
 * require Model
 */
const _model = require('../models/procedureModel');
const _baseModel = require('../models/baseModel');

/**
 * require Controller
 */
const base = require('./baseController');

/**
 * require Helpers
 */

const {
    SUCCESS_200,
    ERR_400,
    ERR_404,
    ERR_500,
} = require('../helpers/constants/statusCodeHTTP');


const {
    FIELD_AGENT,
} = require('../helpers/constants');


/**
 * require Utils
 */
const ResError = require('../utils/resError');
const APIFeatures = require('../utils/apiFeatures');

exports.reportAutocallBroadcast = reportAutocallBroadcast;
exports.reportAutocallSurvey = reportAutocallSurvey;
exports.reportAutocallSurvey2 = reportAutocallSurvey2;
exports.reportInboundImpactByAgent = reportInboundImpactByAgent;
exports.reportCallByCustomerKH01 = reportCallByCustomerKH01;
exports.reportDetailStatisticalStatusEndCall = reportDetailStatisticalStatusEndCall;
exports.reportInboundMisscallAndConnectedByAgent = reportInboundMisscallAndConnectedByAgent;
exports.reportInboundByAgent = reportInboundByAgent;
exports.statisticInboundByDay = statisticInboundByDay;

async function reportAutocallBroadcast(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate, campainId } = req.body
        // if (!req.query.Agent_Team)
        // return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);
        if (!startDate || !endDate || !campainId || campainId.length == 0)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportAutocallBroadcast(db, dbMssql, req.query, req.body);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        console.log(doc.recordset.length);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}
async function reportAutocallSurvey(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate, campainId, autoCallSurvey } = req.body

        if (!startDate || !endDate || !campainId || campainId.length == 0)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportAutocallSurvey(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            //get data from cisco gateway
            let { url, reportAutocallSurvey, token } = _config["cisco-gateway"];

            const options = {
                method: "post",
                body: JSON.stringify({
                    startDate: req.body.startDate,
                    endDate: req.body.endDate,
                    ternalID: req.body.autoCallSurvey
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-access-token": token,
                },
            };

            const result = await fetch(
                url + reportAutocallSurvey, options
            ).then((res) => {
                return res.json();
            });

            if (!result.result) {
                return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
            } else {
                //gộp 2 kết quả dựa theo trường RouterCallKey và RouterCallKeyDay để lấy tiến trình cuộc gọi
                let mergeArray = _.map(doc.recordset, function (r1) {
                    var r3 = {};
                    if (result.result.length > 0) {
                        _.map(result.result, function (r2) {
                            if (r1.RouterCallKey == r2._id.RouterCallKey && r1.RouterCallKeyDay == r2._id.RouterCallKeyDay) {
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
                    .json({ data: mergeArray, startDate: req.query.startDate, endDate: req.query.endDate });
            }
        }

    } catch (error) {
        next(error);
    }
}

async function reportAutocallSurvey2(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate, campainId, autoCallSurvey2 } = req.body

        if (!startDate || !endDate || !campainId || campainId.length == 0)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportAutocallSurvey2(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            //get data from cisco gateway
            let { url, reportAutocallSurvey2, token } = _config["cisco-gateway"];

            //let RouterCallKeyDay = _.pluck(doc.recordset, 'RouterCallKeyDay')
            let RouterCallKey = _.pluck(doc.recordset, 'RouterCallKey')
            RouterCallKey = RouterCallKey.map(i => i != null ? i.toString() : '');
            let filtered = RouterCallKey.filter(function (el) {
                return el != null && el != "";
            });

            const options = {
                method: "post",
                body: JSON.stringify({
                    startDate: startDate,
                    endDate: endDate,
                    ternalID: autoCallSurvey2,
                    //RouterCallKeyDay: RouterCallKeyDay,
                    RouterCallKey: filtered
                }),
                headers: {
                    "Content-Type": "application/json",
                    "x-access-token": token,
                },
            };

            const result = await fetch(
                url + reportAutocallSurvey2, options
            ).then((res) => {
                return res.json();
            });

            if (!result.result) {
                return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
            } else {
                //gộp 2 kết quả dựa theo trường RouterCallKey và RouterCallKeyDay để lấy tiến trình cuộc gọi
                let mergeArray = _.map(doc.recordset, function (r1) {
                    var r3 = {};
                    if (result.result.length > 0) {
                        _.map(result.result, function (r2) {
                            if (r1.RouterCallKey == r2._id.RouterCallKey && r1.RouterCallKeyDay == r2._id.RouterCallKeyDay) {
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
                    .json({ data: mergeArray, startDate: req.query.startDate, endDate: req.query.endDate });
            }
        }

    } catch (error) {
        next(error);
    }
}

async function reportInboundImpactByAgent(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportInboundImpactByAgent(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc });
        }
    } catch (error) {
        next(error);
    }
}


async function reportCallByCustomerKH01(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportCallByCustomerKH01(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc, pageCurrent: req.query.pages });
        }
    } catch (error) {
        next(error);
    }
}

async function reportDetailStatisticalStatusEndCall(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportDetailStatisticalStatusEndCall(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc, pageCurrent: req.query.pages });
        }
    } catch (error) {
        next(error);
    }
}

async function reportInboundMisscallAndConnectedByAgent(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportInboundMisscallAndConnectedByAgent(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc, pageCurrent: req.query.pages });
        }
    } catch (error) {
        next(error);
    }
}

async function reportInboundByAgent(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.reportInboundByAgent(db, dbMssql, req.query, req.body);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc, pageCurrent: req.query.pages });
        }
    } catch (error) {
        next(error);
    }
}

async function statisticInboundByDay(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.statisticInboundByDay(db, dbMssql, req.query, req.query);

        if (!doc) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: doc });
        }
    } catch (error) {
        next(error);
    }
}