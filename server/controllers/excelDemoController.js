/**
 * require Model
 */
const _model = require("../models/excelDemoModel");
const _baseModel = require("../models/baseModel");

/**
 * require Controller
 */
const base = require("./baseController");

/**
 * require Helpers
 */

const {
  SUCCESS_200,
  ERR_400,
  ERR_404,
  ERR_500,
} = require("../helpers/constants/statusCodeHTTP");

const { FIELD_AGENT } = require("../helpers/constants");

/**
 * require Utils
 */
const ResError = require("../utils/resError");
const APIFeatures = require("../utils/apiFeatures");

exports.getAll = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    var workbook = new _Excel.Workbook();
    // Đọc file excel
    const doc = await workbook.xlsx.readFile(
      _Path.join(_rootPath, "public", "dnc.xlsx")
    );
    if (!doc) return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);

    /**
     * chạy các sheet
     * // để chạy 1 sheet thì dùng câu lệnh: doc.getWorksheet(1) | doc.getWorksheet('name sheet')
     */
    let resultData = [];
    doc.eachSheet(function (worksheet, sheetId) {
      // run dữ liệu từng sheet
      resultData.push(runDataEachSheet(worksheet, sheetId, query));
    });
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: resultData });
  } catch (error) {
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).send("4428844");
  } catch (error) {
    next(error);
  }
};

/**
 * run dữ liệu từng sheet
 * @param {object} worksheet data sheet: name, _rows, ...
 * @param {number} sheetId index
 */
function runDataEachSheet(worksheet, sheetId, query) {
  let { name, _rows } = worksheet;
  let _headerIndex = 1; // Vị trí của header table: id, sẽ lấy trường này lưu vào db
  let _headerNameIndex = 1; // Vị trí của header table: tiếng việt
  let _headers = worksheet.getRow(_headerIndex).values;
  let _headerNames = worksheet.getRow(_headerNameIndex).values;
  let resultData = [];
  let {field_required} = query;

  if(field_required) field_required = field_required.split(",");
  else field_required = [];
  if(_headers.length == 0) throw new Error("Header empty");
  let mang1k = []
  let mangSplit = [];
  worksheet.eachRow((row, index) => {
    let rowIndex = row._number;

    /**
     * Only read data before row header
     */
    if (rowIndex > _headerNameIndex) {
      // continue
      let rowData = _headers.reduce((preValue, curValue) => {
        let headerIndex = _headers.indexOf(curValue);
        let cellData = row.values[headerIndex];

        if (!preValue[curValue]) preValue[curValue] = cellData ? (typeof cellData == "string" ? cellData.trim(): cellData) : undefined;
        return preValue;
      }, {});

      if(mang1k.length >= 1000){
        mangSplit.push(mang1k);
        mang1k = [];
      }else mang1k.push(rowData)

      if(field_required.length > 0) {
          let check = field_required.map(i => rowData[i] === undefined);
          
          if(!check.includes(true)) resultData.push(rowData);
      }else resultData.push(rowData);
      
    }
  });

  return {
    sheetId,
    name,
    total: resultData.length,
    dataLength: mangSplit.length,
    data: mangSplit,
  };
}
