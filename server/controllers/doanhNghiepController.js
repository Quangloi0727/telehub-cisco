
/**
 * require Model
 */
const _model = require('../models/qaModel');
const fse = require('fs-extra');
const fs = require('fs-extra');
const path = require('path');

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
} = require('../helpers/constants/statusCodeHTTP');

/**
 * require Utils
 */
const ResError = require('../utils/resError');
const APIFeatures = require('../utils/apiFeatures');
const { baseHttpIP } = require('../helpers/functions');
const { updateIntro } = require('../models/agentModel');

exports.updateDoanhNghiep = async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let id = req.params.id;
        let body = req.body;
        delete body.is_deleted;
        delete body.created_at;
        delete body.updated_at;

        if (!body) return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);
        let dbVer;
        dbVer = _config.dbVer + _unit_inc;
        _config.dbVer = dbVer;
        await updateIntro(db, _config._id, { dbVer });

        let rawdata = fse.readFileSync(path.join(_rootPath, req.file.path));
        let jsonData = JSON.parse(rawdata);
        // console.log(jsonData.dbVer);
        // if (req.body.oldLink) {
        //     let _pathImage = req.body.oldLink.replace(`${baseHttpIP()}/static`, path.join(_rootPath, 'uploads'));

        //     _logger.log("info", "remove file JSON: " + _pathImage);
        // await unlinkAsync(path.join(_rootPath, 'uploads','doanhNghiep', 'doanhNghiepFile.json'));

        // }

        _CRUDFile.writeFileSync('daCapCompanyList', jsonData, _config);


        res.status(SUCCESS_200.code).send();

    } catch (error) {
        next(error);
    }
}