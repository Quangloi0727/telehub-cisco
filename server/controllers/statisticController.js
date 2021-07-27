const fetch = require("node-fetch");
/**
 * require Model
 */
const _model = require('../models/statisticModel');
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

const {
    checkKeyValueExists,
    reasonToTelehub,
    variableSQL,
    hms,
    hmsToNumber,
    percentFormat,
    roundAvg,
    logDebug
  } = require("../helpers/functions");


/**
 * require Utils
 */
const ResError = require('../utils/resError');
const APIFeatures = require('../utils/apiFeatures');

// tổng hợp số lượng cuộc gọi theo từng ngày
exports.byDigitDialedByDay = byDigitDialedByDay;

async function byDigitDialedByDay(req, res, next) {
    try {
        let db = req.app.locals.db;
        let dbMssql = req.app.locals.dbMssql;
        let { startDate, endDate } = req.query;

        if (!startDate || !endDate)
            return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

        
        const startTime = Date.now();
        const [doc1, doc2] = await Promise.all([
            _model.byDigitDialedByDay(db, dbMssql, req.query, req.body.callType),
            _model.byDigitDialedByDay(db, dbMssql, req.query, req.body.callType2),
        ]);

        logDebug('Return Result', startTime);
        
        if (!doc1 || !doc2) {
            return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
        } else {
            res
                .status(SUCCESS_200.code)
                .json({ data: mappingStatistic(doc1.recordset, doc2.recordset) });
        }
    } catch (error) {
        next(error);
    }
}

/**
  {
    name: '01/11',
    1900: {
      total: 100,
      north_call: 60,
      south_call: 40,
      
      north_percent: '60 %',
      south_percent: '40 %',
    },
    1800: {
      total: 100,
      north_call: 60,
      south_call: 40,
      
      north_percent: '60 %',
      south_percent: '40 %',
    }
  }
  
  */
function mappingStatistic(
    doc1, doc2
) {
    // tạo dòng MTD (month to date) mặc định

    let result = [];


    let allDays = _.union(
        _.pluck(doc1, "name"),
        _.pluck(doc2, "name")
    );

    // item = 01/11
    allDays.forEach((item) => {
        let temp = {
            name: item,
        };
        let _doc1Found = doc1.find((i) => i.name === item);
        let _doc2Found = doc2.find((i) => i.name === item);

        if (_doc1Found) {
            temp["doc1"] = Object.assign({}, _doc1Found);
   
            temp["doc1"]["north_percent"] = percentFormat(
                temp["doc1"]["north_call"],
                temp["doc1"]["total"]
            );
            temp["doc1"]["south_percent"] = percentFormat(
                temp["doc1"]["south_call"],
                temp["doc1"]["total"]
            );

            delete temp["doc1"].type;
            delete temp["doc1"].DateTime;
            delete temp["doc1"].name;
        }

        temp["doc2"] = rowInitStatistic();

        if (_doc2Found) {

            temp["doc2"] = Object.assign({}, _doc2Found);

            temp["doc2"]["north_percent"] = percentFormat(
                temp["doc2"]["north_call"],
                temp["doc2"]["total"]
            );
            temp["doc2"]["south_percent"] = percentFormat(
                temp["doc2"]["south_call"],
                temp["doc2"]["total"]
            );

            delete temp["doc2"].type;
            delete temp["doc2"].DateTime;
            delete temp["doc2"].name;
        }

        result.push(temp);

        // //loại bỏ những data có name:undefined 
        // result = result.filter(function (el) {
        //     return el.name != undefined
        // })

    });

    return result;
}

function rowInitStatistic() {
    return {
        total: 0,
        north_call: 0,
        south_call: 0,

        north_percent: '0 %',
        south_percent: '0 %',
    };
}
