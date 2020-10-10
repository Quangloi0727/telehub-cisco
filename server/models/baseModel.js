const ObjectID = require("mongodb").ObjectID;


/**
 * require models
 */

/**
 * require Helpers
 */

// variable

// const {
//     FIELD_PRODUCT,
// } = require('../helpers/constants');

// function

const { replaceSignOfVietnameseString, capitalizeFirstLetter, lowerCaseFirstLetter, baseHttpIP } = require("../helpers/functions");
const APIFeatures = require("../utils/apiFeatures");
const { getBase } = require("../controllers/baseController");

exports.getAll = async (db, Model, query, option) => {
    try {
        let _query = {};

        // check admin userType here
        _query.is_deleted = { $ne: true };
        // _logger.log('info', `GetAll ${Model}; query: ${JSON.stringify(query)}`)
        const count = await db.collection(Model).count(_query);
        if(count === 0) return {
            count,
            page: 0,
            data: []
        }

        const AllData = new APIFeatures(
            db.collection(Model).find(_query),
            query
        );

        const features = AllData.sort().paginate();
        let doc = await features.query.toArray();
        const { page, limit, extra } = features.queryString;
        // console.log(getDistinctValue(doc, extra));
        doc = handleResult(doc, getBaseByModal(Model));
        if (extra) {
            const docExtra = await this.addExtra(db, Model, doc, extra);

            return {
                count,
                page,
                data: docExtra,
            };
        }
        return {
            count,
            page,
            data: doc,
        }
    } catch (error) {
        return error;
    }
};

exports.getByID = async (db, Model, id) => {
    try {
        const doc = await db
            .collection(Model)
            .findOne({ _id: ObjectID(id), is_deleted: { $ne: true } });
        return doc;
    } catch (error) {
        return error;
    }
};

exports.getByIDs = async (db, Model, ids) => {
    try {
        const isObjectID = /[0-9a-f]{24}/;
        const _ids = ids.filter((i) => isObjectID.test(i));
        const doc = await db
            .collection(Model)
            .find({
                _id: { $in: _ids.map(ObjectID) },
                is_deleted: { $ne: true },
            })
            .toArray();
        return doc;
    } catch (error) {
        return error;
    }
};

exports.getByKey = async (db, Model, key, value) => {
    try {
        let q = {};
        q[`${key}`] = {
            $in: value,
        };
        const doc = await db
            .collection(Model)
            .find({ ...q, is_deleted: { $ne: true } })
            .toArray();

        return doc;
    } catch (error) {
        return error;
    }
};

exports.searchByKey = async (db, Model, key, value, type = "string") => {
    try {
        let nameReg = new RegExp(`${value}`, "i");
        let q = {};
        q[`${key}`] = nameReg;
        q[`${key}_normal`] = nameReg;
        const $or = Object.keys(q).map((item, index) => {
            let obj = {};
            obj[item] = q[item];
            return obj;
        });
        // console.log(q, type);
        let query = {};
        if (type === "number") query[`${key}`] = Number(value);
        else query = { $or: $or };
        const doc = await db
            .collection(Model)
            .find({ ...query, is_deleted: { $ne: true } })
            .toArray();

        // khi nào cần update thêm field thì bỏ comment
        // doc.forEach(item => {
        //     let $set = {};
        //     $set[`${key}_normal`] = replaceSignOfVietnameseString(item[key]);
        //     db.collection(Model).updateOne({ _id: ObjectID(item._id) }, { $set });
        // });
        return doc;
    } catch (error) {
        return error;
    }
};


const getBaseByModal = (Model) => {
    let __base_modal = '';
    __base_modal = lowerCaseFirstLetter(Model);

    return __base_modal;
}


function handleResult(result, baseByModal) {
    let r;
    if (Array.isArray(result)) {
        r = result.map(i => {
            
            if (i.link && i.link !== '') i.link = `${baseHttpIP()}/static/${baseByModal}/${i.link}`
            if (!i.link && ['ads', 'nghiDinh', 'setting'].includes(baseByModal)) {
                if(i.link === ''){
                    i.link = '';
                }else i.link = `${baseHttpIP()}/static/${baseByModal}/default.jpg`

            }
            return i;
        });

    } else {
        r = { ...result };
    }

    return r;
}


exports.addExtra = (db, Model, data, extra) => {
    switch (Model) {
        default:
            return data;
    }
};
