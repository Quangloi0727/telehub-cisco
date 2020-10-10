const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getBase } = require('../controllers/baseController');

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        
        // console.log({req, file});
        // console.log({baseUrl: req.baseUrl});
        let folderUpload = 'uploads';
        folderUpload += `/doanhNghiep`;

        // dòng này sẽ tạo folder nếu folder ko tồn tại trên hệ thống
        fs.mkdirSync(folderUpload, { recursive: true });

        cb(null, folderUpload);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // console.log({file})
        // cb(null, file.fieldname + '-' + uniqueSuffix + '.json');
        cb(null, file.fieldname + '.json');
    }
})
let fileFilter = (req, file, cb) => {
    // Accept images only, |gif|GIF
    if (!file.originalname.match(/\.(json)$/)) {
        req.fileValidationError = 'Only json files are allowed!';
        return cb(new Error('Only json files are allowed!'), false);
    }

    cb(null, true)
}
let upload = multer({ storage, fileFilter, });

module.exports = upload;