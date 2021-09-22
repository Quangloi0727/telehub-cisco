const { exec } = require('child_process');
const fs = require('fs');
const moment = require('moment');
const path = require('path');


const { SUCCESS_200, ERR_500 } = require("../helpers/constants/statusCodeHTTP");
const ResError = require("../utils/resError");

exports.reportDoNotCall = async (req, res, next) => {
  try {
    let host = process.env.DB_FAST_CONTACT_HOST;
    let user = process.env.DB_FAST_CONTACT_USER;
    let pass = process.env.DB_FAST_CONTACT_PASS;
    let auth = process.env.DB_FAST_CONTACT_AUTH;
    let hostSplit = host.split(',');
    let dir = path.join('public', 'exports', 'donotcall');
    let fileName = `donotcall.bk.${moment().format('HH.mm.ss-DD.MM.YYYY')}.csv`;
    let pathFile = path.join(_rootPath, dir, fileName);

    if (!hostSplit || hostSplit.length <= 0) throw new Error('Không tìm thấy IP Fast Contact Cloud!');

    // Kiểm tra xem thư mục exports có tồn tại không, nếu không thì tạo mới
    if (!fs.existsSync(path.join(_rootPath, dir))) {
      fs.mkdirSync(path.join(_rootPath, dir), { recursive: true });
    }

    let url = `mongoexport --db fast-contact-cloud --collection donotcalls --out=${pathFile} --type csv --fields STT,called,type -h ${hostSplit[hostSplit.length - 1]}  -u '${user}' -p '${pass}' --authenticationDatabase=${auth}`;

    exec(url, (error, data, getter) => {
      if (error) {
        console.log(`------- error ------- `);
        console.log(error);
        console.log(`------- error ------- `);

        return next(new ResError(ERR_500.code, 'Có lỗi xảy ra!'), req, res, next);
      }

      console.log(`------- result ------- `);
      console.log('data: ', data);
      console.log('getter: ', getter);
      console.log(`------- result ------- `);

      let totalStr = getter.split('exported ')[1].trim();
      let total = totalStr.split(' ')[0].trim();

      return res.status(SUCCESS_200.code).json({
        total: total,
        url: `/public/exports/donotcall/${fileName}`,
      });
    });
  } catch (error) {
    return next(new ResError(ERR_500.code, error.message ? error.message : error), req, res, next);
  }
};