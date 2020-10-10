/**
 * Tạo các Function
 *  getByID
 *  getByIDs
 *  create
 *  creates ???
 *  update
 *  updates ???
 *  delete
 *  deletes ???
 *  getAll
 */
const ObjectID = require("mongodb").ObjectID;

/**
 * require models
 */
const baseModel = require("../models/baseModel");

/**
 * require Helpers
 */

const {
    SUCCESS_200,
    ERR_400,
    ERR_404,
} = require("../helpers/constants/statusCodeHTTP");

const { getDistinctValue, baseHttpIP } = require("../helpers/functions/commons");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

/**
 * Hàm lấy danh sách tất cả các giá trị của Model có trong DB
 */

exports.getAll = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        const { passport } = req.session || {}; // fix nếu run server  ko có auth
        let isAdmin = false;
        if (passport && passport.user && passport.user.type === 1)
            isAdmin = true;

        // query: sortBy=count,test&sortType=-1,-1&limit=1&page=5
        let result = await baseModel.getAll(db, Model, req.query);
        
        res.status(SUCCESS_200.code).json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm lấy giá trị theo ID của Model có trong DB
 */

exports.getByID = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let id = req.params.id;
        const { extra } = req.query;
        const doc = await baseModel.getByID(db, Model, id);

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );

        if (extra) {
            const docExtra = await this.addExtra(db, Model, doc, extra);

            return res.status(SUCCESS_200.code).json(docExtra);
        }
        res.status(SUCCESS_200.code).json(doc);
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm lấy giá trị theo ID của Model có trong DB
 */

exports.getByIDs = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let ids = req.query.ids;

        if (!ids)
            return next(
                new ResError(ERR_400.code, ERR_400.message),
                req,
                res,
                next
            );

        ids = ids.split(",");
        const doc = await baseModel.getByIDs(db, Model, ids);

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );
        if (doc.message) throw Error(doc);

        res.status(SUCCESS_200.code).json(doc);
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm tạo mới Model vào DB
 * NOTE: thêm tất cả các value có trong body (Vì đây là hàm mặc định)
 */

exports.create = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let body = req.body;

        if (!body)
            return next(
                new ResError(ERR_400.code, ERR_400.message),
                req,
                res,
                next
            );

        // nếu dài quá nên tách riêng, viết vào phần models của từng component để xử lý
        const doc = await db.collection(Model).insertOne({
            ...body,
            is_deleted: false,
            created_at: (Date.now() / 1000) | 0,
        });
        // insertedCount: 1, insertedIds:  [ 5e6ce37d6b261d103030ca39 ]

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );

        res.status(SUCCESS_200.code).json({ _id: doc.insertedId });
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm cập nhật Model có trong DB
 * NOTE: cập nhật tất cả các value có trong body (Vì đây là hàm mặc định)
 */

exports.update = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let id = req.params.id;
        let $set = {};
        let body = req.body;
        delete body.is_deleted;
        delete body.created_at;
        delete body.updated_at;
        // console.log('update', body);

        if (body) $set = { ...body, updated_at: (Date.now() / 1000) | 0 };

        // nếu dài quá nên tách riêng, viết vào phần models của từng component để xử lý
        const doc = await db
            .collection(Model)
            .updateOne(
                { _id: ObjectID(id), is_deleted: { $ne: true } },
                { $set }
            );
        //  modifiedCount: 0, upsertedId: null, upsertedCount: 0, matchedCount: 0

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );
        if (doc.modifiedCount == 0)
            return next(
                new ResError(ERR_404.code, ERR_404.message_detail.Category),
                req,
                res,
                next
            );
        res.status(SUCCESS_200.code).send();
    } catch (error) {
        next(error);
    }
};

/**
 * Tạm thời ẩn khỏi DB bằng cách set is_deleted = true
 */
exports.delete = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let id = req.params.id;
        let { type } = req.query;
        let dbVer;

        let { nghiDinhID } = req.body;


        let doc =
            type === "delete"
                ? await db.collection(Model).remove({ _id: ObjectID(id) })
                : await db.collection(Model).update(
                    { _id: ObjectID(id), is_deleted: { $ne: true } },
                    {
                        $set: {
                            is_deleted: true,
                            updated_at: (Date.now() / 1000) | 0,
                        },
                    }
                );

        if (!doc.result.n)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );
        dbVer = _config.dbVer + _unit_inc;
        _config.dbVer = dbVer;
        // await updateIntro(db, _config._id, { dbVer });
        let keyModel = '';
        if (Model === _QA_COLLECTION) keyModel = 'qAndA';
        if (Model === _DIEUKHOAN_COLLECTION) keyModel = 'phapLuatBHDC.dieuKhoan';
        if (Model === _NGHIDINH_COLLECTION) keyModel = 'phapLuatBHDC';
        if (Model === _NOTE_COLLECTION) keyModel = 'luuYNhaPhanPhoi';
        // if (Model === QA_COLLECTION) keyModel = 'qAndA';

        _CRUDFile.deleteWriteFileSync(keyModel, { _id: id, nghiDinhID }, _config);

        res.status(SUCCESS_200.code).send();
    } catch (error) {
        next(error);
    }
};

/**
 * Xóa vĩnh viễn khỏi DB, sẽ ít dùng sau này, chủ yếu chỉ set is_deleted = true
 */
exports.delete4Ever = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let id = req.params.id;

        let doc = await db.collection(Model).remove({ _id: ObjectID(id) });
        if (!doc.result.n)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );

        res.status(SUCCESS_200.code).send();
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm lấy tất cả các value của field trong của Model có trong DB
 */

exports.getDistinct = (Model) => async (req, res, next) => {
    try {
        let db = req.app.locals.db;
        let name = req.query.name;
        const doc = await db.collection(Model).distinct(name);

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );
        res.status(SUCCESS_200.code).json(doc);
    } catch (error) {
        next(error);
    }
};

/**
 * Hàm lấy ra ID của field trong của Model có trong DB
 */

exports.getLastIndex = (Model) => async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const name = req.query.name;
        const charName = req.query.charName;
        let searchReg = new RegExp(`^${charName}\\d\\d\\d\\d\\d\\d`, "i");
        const query = {};
        const sort = {};
        const json = {};
        query[name] = searchReg;
        // query.is_deleted = { $ne: true };
        sort[name] = -1;
        const doc = await db
            .collection(Model)
            .find(query)
            .sort(sort)
            .limit(1)
            .toArray();
        // .sort({code: -1})

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );

        if (!doc[0]) json[name] = 0;
        else {
            // chỉ lấy những
            json[name] = Number(doc[0][name].replace(/\D/g, ""));
            // console.log(json[name]);
        }
        res.status(SUCCESS_200.code).json(json);
    } catch (error) {
        next(error);
    }
};

exports.searchByKey = (Model) => async (req, res, next) => {
    try {
        const db = req.app.locals.db;
        const { key, value, type, extra } = req.query;
        const doc = await baseModel.searchByKey(db, Model, key, value, type);
        // .sort({code: -1})

        if (!doc)
            return next(
                new ResError(ERR_404.code, ERR_404.message),
                req,
                res,
                next
            );

        if (extra) {
            const docExtra = await this.addExtra(db, Model, doc, extra);

            return res.status(SUCCESS_200.code).json(docExtra);
        }
        res.status(SUCCESS_200.code).json(doc);
    } catch (error) {
        next(error);
    }
};

exports.addExtra = (db, Model, data, extra) => {
    switch (Model) {
        case _USER_COLLECTION:
            return userModel.addExtra(db, data, extra);
        case _DIEUKHOAN_COLLECTION:
            return dieuKhoanModel.addExtra(db, data, extra);
        case _NGHIDINH_COLLECTION:
            return nghiDinhModel.addExtra(db, data, extra);
        default:
            return data;
    }
};

const getBase = (baseUrl) => {
    let __base_modal = '';
    // console.log(baseUrl);
    if (baseUrl.includes('/ads')) __base_modal = 'ads';
    if (baseUrl.includes('/setting')) __base_modal = 'setting';
    if (baseUrl.toLowerCase().includes('/nghidinh')) __base_modal = 'nghiDinh';
    // if(baseUrl.includes('/ads')) __base_modal = '/ads';

    return __base_modal;
}

exports.getBase = getBase;    