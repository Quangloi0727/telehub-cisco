const ObjectID = require("mongodb").ObjectID;
/**
 * require Helpers
 */
const {
    DB_HOST,
    PORT,
    IP_PUBLIC,
} = process.env

// variable

const { FIELD_INTRO } = require("../helpers/constants");

// function

const { checkKeyValueExists } = require("../helpers/functions");

// intro collection mongodb
exports.createIntro = async (db, body) => {
    try {
        const _collection = db.collection(process.env.INTRO_COLLECTION);
        // console.log({INIT_DATA: process.env.INIT_DATA});
        if (process.env.INIT_DATA === undefined) {
            const keyCheckExists = FIELD_INTRO.checkExists;

            let docCheck = await checkKeyValueExists(
                _collection,
                keyCheckExists,
                body
            );

            if (docCheck) {
                return docCheck;
            }
        }

        return await _collection.insertOne({
            ...body,
            is_deleted: false,
            created_at: (Date.now() / 1000) | 0,
        });
    } catch (error) {
        return error;
    }
};

exports.updateIntro = async (db, id, body) => {
    try {
        const keyCheckExists = FIELD_INTRO.checkExists;
        const _collection = db.collection(process.env.INTRO_COLLECTION);
        const $set = {};

        if (body.title !== undefined) $set.title = body.title;
        if (body.content !== undefined) $set.content = body.content;
        if (body.dbVer != undefined) {
            $set.dbVer = body.dbVer;
            _config.dbVer = body.dbVer;
        }
        else {
            _config.dbVer += _unit_inc;
            $set.dbVer = _config.dbVer;
        }

        $set.updated_at = (Date.now() / 1000) | 0;
        let docCheck = await checkKeyValueExists(
            _collection,
            keyCheckExists,
            body,
            id
        );
        if (docCheck) {
            return docCheck;
        }

        return await _collection.updateOne(
            { _id: ObjectID(id), is_deleted: { $ne: true } },
            { $set }
        );
    } catch (error) {
        return error;
    }
};

// intro collection mongodb
exports.getLastIntro = async (db) => {
    try {
        const _collection = db.collection(process.env.INTRO_COLLECTION);
        const intros = await _collection.find({ is_deleted: { $ne: true } }).sort({ created_at: -1 }).toArray();
        const result = intros[0];
        const mockup = `http://${IP_PUBLIC}:${PORT}/api/v1/intro/download`;

        return { ...result, mockup };
    } catch (error) {
        return error;
    }
};