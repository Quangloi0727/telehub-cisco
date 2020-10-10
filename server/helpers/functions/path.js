const path = require("path");

exports.basename = (filename) => {
    // console.log(__dirname)
    
    let pathName = path.basename(filename);
    return pathName;
};
