// require
require("localenv");
const AppError = require("./server/utils/appError");

//  define val
const port = Number(process.env.PORT) + 101;

process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION!!! shutting down...");
    console.log(new AppError(err).get());
    process.exit(1);
});

const { initDB } = require("./server/db/connection");

let connect = initDB();
connect
    .then((db) => {
        const app = require("./server/app")(db);

        app.listen(port, () => {
            console.log(`Application is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.log(new AppError(err).get());
    });

process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION!!!  shutting down ...");
    console.log(new AppError(err).get());
    // server.close(() => {
    process.exit(1);
    // });
});
