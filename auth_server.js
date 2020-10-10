// require
require('localenv');
const AppError = require('./server/utils/appError');
const path = require('path');
const CRUDFlle = require('./server/utils/crud.file');

let pathFileConfig = path.normalize(path.join(__dirname, 'config', 'conf.json'));

//  define val
const port = process.env.PORT;
const {
    USER_COLLECTION,
    NGHIDINH_COLLECTION,
    DIEUKHOAN_COLLECTION,
    INTRO_COLLECTION,
    QA_COLLECTION,
    NOTE_COLLECTION,
    SETTING_COLLECTION,
} = process.env;

global._rootPath = path.dirname(require.main.filename);
global._CRUDFile = new CRUDFlle(pathFileConfig);
global._config = _CRUDFile.readFileSync();
global._logger = require("./server/config/log")(path.basename(__filename));
global._unit_inc = 1;

process.on('uncaughtException', err => {
    _logger.log('error', 'UNCAUGHT EXCEPTION!!! shutting down...');
    _logger.log('error', (new AppError(err).get()));
    process.exit(1);
});

const { initDB } = require('./server/db/connection');

let connect = initDB();

connect.then((db) => {

    const app = require('./server/auth_app')(db);

    app.listen(port, () => {

        _logger.log('info', `Application Passport is running on port ${port}`);
    });

}).catch((err) => {
    _logger.log('error', new AppError(err).get());
});

process.on('unhandledRejection', err => {
    _logger.log('error', 'UNHANDLED REJECTION!!!  shutting down ...');
    _logger.log('error', new AppError(err).get());
    // server.close(() => {
    process.exit(1);
    // });
});