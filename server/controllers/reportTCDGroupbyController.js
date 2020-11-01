
/**
 * require Model
 */
const _model = require('../models/reportTCDGroupbyModal');
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

exports.callDisposition = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;

        let query  = req.query;

        if(query.callDisposition) query.callDisposition = query.callDisposition.split(",");
        else query.callDisposition = [19, 3, 60, 7];
        
        if (
            !query.startDate ||
            !query.endDate ||
            !query.callTypeID
        ) return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.callDisposition(db, dbMssql, query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}

exports.skillGroup = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;

        let query  = req.query;

        if(query.skillGroup) query.skillGroup = query.skillGroup.split(",");
        else query.skillGroup = [19, 3, 60, 7];
        
        if (
            !query.startDate ||
            !query.endDate ||
            !query.callTypeID
        ) return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.skillGroup(db, dbMssql, query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}