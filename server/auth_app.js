const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const favicon = require('serve-favicon');
const cors = require("cors");

const { pathDB } = require("./db/connection");

// import helpers
const { ERR_404, ERR_401, DATE_TIME, SUCCESS_200 } = require("./helpers/constants");
const { checkAuthenticated } = require("./helpers/functions");

const {

} = process.env;

// import controllers
const globalErrHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const ResError = require("./utils/resError");

function initServer(db, dbMssql) {
    const app = new express();
    // const initPassport = require("./auth/init");
    // write code middleware do something in HERE...
    app.locals.db = db;
    app.locals.dbMssql = dbMssql;

    // for parsing application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    // app.use(express.bodyParser({limit: '50mb'}));
    // for parsing application/json
    app.use(bodyParser.json());

    // for parsing multipart/form-data

    app.use(express.static("public"));

    app.use('/static', express.static("uploads"));

    app.use(favicon(path.join(_rootPath, 'public', 'favicon.ico')))

    // const optionsCors = {
    //     origin: function (origin, callback) {
    //         console.log(origin);
    //         const listNotAllow = ["http://localhost:3000"];

    //         if (listNotAllow.indexOf(origin) !== -1 || !origin) {
    //             callback(null, true);
    //         } else {
    //             callback(new Error("Not allowed by CORS"));
    //         }
    //     },
    // };
    // app.use(cors(optionsCors));
    app.use(
        cors({
            origin: /149.28.151.182:3000|localhost:3000|10.0.1.8:3000/,
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
            credentials: true,
        })
    );

    // app.use((req, res, next) => {
	// 	// req.ip = getIP(req)
	// 	res.header("Access-Control-Allow-Origin", "*")
	// 	res.header("Access-Control-Allow-Headers", "*")
	// 	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")
	// 	next()
    // })
    
    app.use(checkAuthenticated);
    
    app.get("/", (req, res) => {
        res.json({message: "Welcome to Cisco API!"});
    });

    app.use("/api/v1/agent", require("./routes/agentRoute"));
    app.use("/api/v1/callType", require("./routes/callTypeRoute"));
    app.use("/api/v1/skillGroup", require("./routes/skillGroupRoute"));
    app.use("/api/v1/reportTRCallType", require("./routes/reportTRCallTypeRoute"));
    app.use("/api/v1/reportTCDCallTypeAgentDetail", require("./routes/reportTCDCallTypeAgentDetailRoute"));
    app.use("/api/v1/reportTCDGroupby", require("./routes/reportTCDGroupbyRoute"));
    app.use("/api/v1/reportCustomize", require("./routes/reportCustomizeRoute"));

    app.use("/api/v1/exceldemo", require("./routes/excelDemoRoute"));


    app.use("*", (req, res, next) => {
        const err = new ResError(ERR_404.code, `Page ${ERR_404.message}`);
        next(err, req, res, next);
    });

    // fun handle error
    app.use(globalErrHandler);

    return app;
}

module.exports = initServer;
