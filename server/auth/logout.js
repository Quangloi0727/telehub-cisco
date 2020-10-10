const LocalStrategy = require("passport-local").Strategy;
const func = require("./init");
let User = require("../models/userModel");

const ResError = require("../utils/resError");
const { ERR_400, ERR_401, ERR_403, ERR_404 } = require("../helpers/constants");

const { hashPassword } = require("../helpers/functions");

const { USER_COLLECTION } = process.env;

module.exports = function (passport) {
    passport.use(
        "logout",
        new LocalStrategy(
            {
                passReqToCallback: true,
            },
            async (req, username, password, done) => {
                const db = req.app.locals.db;
                let doc = await db
                    .collection(USER_COLLECTION)
                    .findOne({ username, is_deleted: { $ne: true } });
                if (!doc)
                    return done(
                        new ResError(ERR_404.code, ERR_404.message_detail.User)
                    );

                let hashPass = hashPassword(password, doc.salt);
                if (hashPass !== doc.password)
                    return done(
                        new ResError(
                            ERR_401.code,
                            ERR_401.message_detail.incorrectPass
                        )
                    );
                let objCopy = { ...doc };
                delete objCopy.is_deleted;
                delete objCopy.createdBy_id;
                delete objCopy.password;
                delete objCopy.salt;
                return done(null, objCopy);
            }
        )
    );
};
