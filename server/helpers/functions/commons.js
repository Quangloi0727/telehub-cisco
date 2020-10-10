const ObjectID = require('mongodb').ObjectID;

const {
    DB_HOST, PORT,
    IP_PUBLIC
} = process.env;

exports.checkKeyValueExists = async (collection, keys, dataValue, id) => {
    if (keys.length == 0) return 0;
    const queryCheck = keys.map(i => {
        let opts = {};
        opts[i] = dataValue[i];
        return opts;
    });

    const query = { $or: queryCheck, is_deleted: { $ne: true } };

    // for update
    if(id) query._id = { $ne: ObjectID(id)};

    let docCheck = await collection.findOne(query);
    if (docCheck) {
        for (let index = 0; index < keys.length; index++) {
            const element = keys[index];
            let opt = {};
            if (dataValue[element] == docCheck[element]) {
                opt[element] = dataValue[element];
                return { ...opt };
            }
        }
    } else return docCheck;
}

/**
 *
 * @param {Array} data mảng json
 * @param {String} field key của json trong mảng data với value là mảng
 */
exports.getDistinctObject = (data, field) => {
    let unique = [];
    let distinct = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i][field] && !unique[data[i][field]]) {
            distinct = [...new Set([...distinct, ...[...data[i][field]]])]
            unique[data[i][field]] = 1;
        }
    }
    return distinct
}

/**
 *
 * @param {Array} data mảng json
 * @param {String} field key của json trong mảng data với value là text hoặc number
 */

exports.getDistinctValue = (data, field) => {
    let unique = [];
    let distinct = [];
    for (let i = 0; i < data.length; i++) {
        if (data[i][field] && !unique[data[i][field]]) {
            distinct.push(data[i][field]);
            unique[data[i][field]] = 1;
        }
    }
    return distinct
}

exports.replaceSignOfVietnameseString = (str) => {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str.toLowerCase();
  };

exports.baseHttpIP = (ip = IP_PUBLIC, port = PORT) => {
    
    return `http://${ip}:${port}`;
  };