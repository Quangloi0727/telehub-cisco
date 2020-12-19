/**
 * require Model
 */
const _model = require("../models/reportTCDCallTypeAgentDetailModal");
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

    if (!query.startDate || !query.endDate)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    for (let i = 0; i < Object.keys(query).length; i++) {
      const item = Object.keys(query)[i];
      // const element = query[item];
      if (item.includes("CT_ToAgentGroup")) {
        let groupNumber = item.replace("CT_ToAgentGroup", "");

        if (!query[`CT_Queue${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
            ),
            req,
            res,
            next
          );
        }

        // do ko cần đến voice
        // if (!query[`SG_Voice_${groupNumber}`]) {
        //   return next(
        //     new ResError(
        //       ERR_400.code,
        //       `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
        //     ),
        //     req,
        //     res,
        //     next
        //   );
        // }
      }
    }

    const doc = await _model.getAll(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

exports.getByHourBlock = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (!query.startDate || !query.endDate)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    for (let i = 0; i < Object.keys(query).length; i++) {
      const item = Object.keys(query)[i];
      // const element = query[item];
      if (item.includes("CT_ToAgentGroup")) {
        let groupNumber = item.replace("CT_ToAgentGroup", "");

        if (!query[`CT_Queue${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
            ),
            req,
            res,
            next
          );
        }

        // if (!query[`SG_Voice_${groupNumber}`]) {
        //   return next(
        //     new ResError(
        //       ERR_400.code,
        //       `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
        //     ),
        //     req,
        //     res,
        //     next
        //   );
        // }
      }
    }

    const doc = await _model.getByHourBlock(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

exports.getDetailAgent = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;
    query.pages = Number(query.pages) || 1;
    query.paging = query.paging ? Number(query.paging) : 0;
    query.download = query.download ? Number(query.download) : 0;
    query.rows = Number(query.rows) || Number(process.env.LIMIT_DOCUMENT_PAGE);
    if (query.duration_g) query.duration_g = query.duration_g.split(",");
    if (query.wait_g) query.wait_g = query.wait_g.split(",");

    if (
      query.pages <= 0 ||
      query.rows <= 0
    )
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    if (!query.startDate || !query.endDate)
    return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    for (let i = 0; i < Object.keys(query).length; i++) {
      const item = Object.keys(query)[i];
      // const element = query[item];
      if (item.includes("CT_ToAgentGroup")) {
        let groupNumber = item.replace("CT_ToAgentGroup", "");

        if (!query[`CT_Queue${groupNumber}`]) {
          return next(
            new ResError(
              ERR_400.code,
              `${ERR_400.message_detail.missingKey} CT_Queue${groupNumber}`
            ),
            req,
            res,
            next
          );
        }

        // do ko dùng tới SG_Voice_
        // if (!query[`SG_Voice_${groupNumber}`]) {
        //   return next(
        //     new ResError(
        //       ERR_400.code,
        //       `${ERR_400.message_detail.missingKey} SG_Voice_${groupNumber}`
        //     ),
        //     req,
        //     res,
        //     next
        //   );
        // }
      }
    }

    const doc = await _model.getDetailAgent(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

exports.getGroupByCallDisposition = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;

    if (query.callDisposition)
      query.callDisposition = query.callDisposition.split(",");
    else query.callDisposition = [19, 3, 60, 7];

    if (!query.startDate || !query.endDate || !query.callTypeID)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    const doc = await _model.getGroupByCallDisposition(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

exports.missCall = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;
    query.pages = Number(query.pages) || 1;
    query.paging = query.paging ? Number(query.paging) : 0;
    query.download = query.download ? Number(query.download) : 0;
    query.rows = Number(query.rows) || Number(process.env.LIMIT_DOCUMENT_PAGE);

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    if (query.CT_ToAgentGroup1 && !query.CT_Queue1)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue1`
        ),
        req,
        res,
        next
      );
    if (query.CT_ToAgentGroup2 && !query.CT_Queue2)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue2`
        ),
        req,
        res,
        next
      );
    if (query.CT_ToAgentGroup3 && !query.CT_Queue3)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue3`
        ),
        req,
        res,
        next
      );

    const doc = await _model.missCall(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};

exports.missCallByCustomer = async (req, res, next) => {
  try {
    let db = req.app.locals.db;
    let dbMssql = req.app.locals.dbMssql;

    let query = req.query;
    query.pages = Number(query.pages) || 1;
    query.paging = query.paging ? Number(query.paging) : 0;
    query.download = query.download ? Number(query.download) : 0;
    query.rows = Number(query.rows) || Number(process.env.LIMIT_DOCUMENT_PAGE);

    if (!query.startDate || !query.endDate || !query.CT_IVR)
      return next(new ResError(ERR_400.code, ERR_400.message), req, res, next);

    if (query.CT_ToAgentGroup1 && !query.CT_Queue1)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue1`
        ),
        req,
        res,
        next
      );
    if (query.CT_ToAgentGroup2 && !query.CT_Queue2)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue2`
        ),
        req,
        res,
        next
      );
    if (query.CT_ToAgentGroup3 && !query.CT_Queue3)
      return next(
        new ResError(
          ERR_400.code,
          `${ERR_400.message_detail.missingKey} CT_Queue3`
        ),
        req,
        res,
        next
      );

    const doc = await _model.missCallByCustomer(db, dbMssql, query);

    if (!doc)
      return next(new ResError(ERR_404.code, ERR_404.message), req, res, next);
    // if (doc && doc.name === "MongoError") return next(new ResError(ERR_500.code, doc.message), req, res, next);
    res.status(SUCCESS_200.code).json({ data: doc });
  } catch (error) {
    next(error);
  }
};
