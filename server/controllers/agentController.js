
/**
 * require Model
 */
const _model = require('../models/agentModel');
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

exports.agentMemberTeam = agentMemberTeam;

exports.getAll = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;

        const doc = await _model.getAll(db, dbMssql);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        console.log(doc.recordset.length);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}
// exports.getByIDIntro = base.getByID(process.env.AGENT_COLLECTION);
// exports.getByIDs = base.getByIDs(process.env.AGENT_COLLECTION);

// base.create(process.env.AGENT_COLLECTION);

exports.createIntro = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        // let id = req.params.id;
        let body = req.body;
        // console.log(body);
        let keyRequires = FIELD_AGENT.require;
        let keyCheckEXISTS = FIELD_AGENT.checkExists;

        if (!body) return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        for (let index = 0; index < keyRequires.length; index++) {
            const element = keyRequires[index];

            if (!body[element]) {
                return next(new ResError(ERR_400.code, `${ERR_400.message_detail.missingKey} ${FIELD_AGENT.getName[element]}`), req, res, next);
            }
        };

        const doc = await _model.createIntro(db, body);
        // insertedCount: 1, insertedId:  "5e6ce37d6b261d103030ca39"

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);

        let keyNameExists = Object.keys(doc)[0];
        if (keyCheckEXISTS.includes(keyNameExists)) {

            return next(new ResError(ERR_400.code, `${FIELD_AGENT.getName[keyNameExists]} ${body[keyNameExists]} ${ERR_400.message_detail.isExists}`), req, res, next);
        }

        res.status(SUCCESS_200.code).json({ _id: doc.insertedId });
    } catch (error) {
        next(error);
    }
}

exports.getLast = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        const doc = await _model.getLastIntro(db);
        // const docNghiDinh = await _baseModel.getAll(db, _NGHIDINH_COLLECTION, req.query);
        // const docNote = await _baseModel.getAll(db, _NOTE_COLLECTION, req.query);
        // const docQA = await _baseModel.getAll(db, _QA_COLLECTION, req.query);
        const docSetting = await _baseModel.getAll(db, _SETTING_COLLECTION, req.query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);

        res.status(SUCCESS_200.code).send({
            _id: doc._id,
            dbVer: doc.dbVer,
            setting: {
                "homeTitle": docSetting.data[0].title,
                "bannerImgLink": docSetting.data[0].link,
                "youtubeLink": docSetting.data[0].link_youtube,
                "mlmCompanyListUpdateAt": docSetting.data[0].mlmCompanyListUpdateAt,
            },

            mockup: doc.mockup,
            created_at: doc.created_at,
            updated_at: doc.updated_at,

        });
    } catch (error) {
        next(error);
    }
}

exports.download = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        // const doc = await _model.getLastIntro(db);

        // if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);

        res.status(SUCCESS_200.code).download("private/mockup.json");
    } catch (error) {
        next(error);
    }
}

exports.deleteIntro = base.delete(process.env.AGENT_COLLECTION);

async function agentMemberTeam (req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;

        if (!req.query.Agent_Team)
        return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        const doc = await _model.agentMemberTeam(db, dbMssql, req.query);

        if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
        console.log(doc.recordset.length);
        res.status(SUCCESS_200.code).json({ data: doc });

    } catch (error) {
        next(error);
    }
}