
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

async function reportAutocallBroadcast (req, res, next) {
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