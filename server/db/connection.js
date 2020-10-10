const { MongoClient } = require("mongodb");

const { DATABASE, DB_HOST, DB_PORT, DB_USER, DB_PASS } = process.env;

initDB = async (
    host = DB_HOST,
    port = DB_PORT,
    user = DB_USER,
    pass = DB_PASS,
    database = DATABASE
) => {
    try {
        let path = pathDB(host, port, database, user, pass);
        return await MongoClient.connect(path);
    } catch (error) {
        throw error;
    }
};

function pathDB(host, port, database, user, pass) {
    let path = `mongodb://${host}:${port}/${database}`;
    if (user !== "#" && pass !== "#")
        path = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(
            pass
        )}@${host}:${port}/${database}`;
    return path;
}

module.exports = {
    initDB,
    pathDB,
};
