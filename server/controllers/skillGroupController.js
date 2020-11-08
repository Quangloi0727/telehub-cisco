
/**
 * require Model
 */
const _model = require('../models/skillGroupModel');
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

// exports.getAll = async (req, res, next) => {
//     try {
//         let db = req.app.locals.db;
//         let dbMssql = req.app.locals.dbMssql;
//         let query  = req.query;
//         const doc = await _model.getAll(db, dbMssql, query);

//         if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
//         // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
//         res.status(SUCCESS_200.code).json({ data: doc });

//     } catch (error) {
//         next(error);
//     }
// }

exports.distinctTCD = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let query  = req.query;
        
        if (
            !query.startDate ||
            !query.endDate ||
            !query.CT_IVR
        ) return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.distinctTCD(db, dbMssql, query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}

exports.byIds = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let query  = req.query;
        
        if (
            !query.ids
        ) return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.byIds(db, dbMssql, query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}