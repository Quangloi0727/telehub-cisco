    // require('localenv');
let rp = require('request-promise');
let Promise = require('promise');
const cheerio = require('cheerio');
const { initDB } = require('../db/connection');
const ObjectID = require('mongodb').ObjectID;
const { getDistinctValue } = require('../helpers/functions');
const Json2csvParser = require("json2csv").Parser;
const fs = require("fs");

// fix duplicate barcode
initDB('localhost', 27017, '', '', 'FECS').then(async (db) => {
    const isObjectID = /[0-9a-f]{24}/;
    console.log("connect success")
    let col_customer = db.collection("Customer");
    let col_user = db.collection("User");
    let customers = await col_customer.find({is_deleted: { $ne: true }}).toArray();
    let userIDs = getDistinctValue(customers, "userID");
    let users = await col_user.find({
        _id: { $in: userIDs.filter((i) => isObjectID.test(i)).map(ObjectID) },
        is_deleted: { $ne: true },
    }).toArray();

    customers = customers.map(c => {
        let _user = users.find(u => u._id == c.userID) || {};
        let name = _user.name;
        let phone = _user.phone;

        return {
            name,
            phone,
            address: c.address,
        }
    });
    console.log(customers);

     const json2csvParser = new Json2csvParser({ header: true });
     const csvData = json2csvParser.parse(customers);
    
     fs.writeFile("customer_mongodb.csv", csvData, function(error) {
         if (error) throw error;
         console.log("Write to bezkoder_mongodb_fs.csv successfully!");
    });

}).catch((err) => {
   console.log(err);
});


// module.exports = getCategory12gmart;
