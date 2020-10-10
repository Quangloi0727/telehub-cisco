const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getBase } = require('../controllers/baseController');

let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        
        // console.log({req, file});
        // console.log({baseUrl: req.baseUrl});
        let folderUpload = 'uploads';
        folderUpload += `/${getBase(req.baseUrl)}`;

        // dòng này sẽ tạo folder nếu folder ko tồn tại trên hệ thống
        fs.mkdirSync(folderUpload, { recursive: true });

        cb(null, folderUpload);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // console.log({file})
        cb(null, file.fieldname + '-' + uniqueSuffix + '.jpg');
    }
})
let fileFilter = (req, file, cb) => {
    // Accept images only, |gif|GIF
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }

    cb(null, true)
}
let upload = multer({ storage, fileFilter, });

module.exports = upload;