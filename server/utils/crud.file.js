const fs = require("fs");
const fse = require("fs-extra");
const { DailyRotateFile } = require("winston/lib/winston/transports");

class CRUDFile {

    constructor(fileName) {
        this.fileName = fileName;
    }

    get getFileName() {
        return this.fileName;
    }

    set setFileName(fileName) {
        this.fileName = fileName
    }

    readFileSync() {
        return require(this.fileName);
    }

    writeFileSync(key, value, data) {
        const keyNormal = ['_id', 'dbVer', 'aboutUs'];
        const { action } = value;
        delete value.created_at;
        delete value.updated_at;
        delete value.is_deleted;

        if (keyNormal.includes(key)) data[key] = value;
        else if (key === "luuYNhaPhanPhoi") {
            let { weight, title, content, status, type, _id } = value;

            let header = data[key].header;
            let list = data[key].list;
            // header
            // console.log("luuYNhaPhanPhoi");
            if (type === 0) {
                header = value.content;
                // console.log("update header");
            } else if (type === 1) { // body

                if (action !== "create") {
                    list = list.map(i => {

                        if (_id === i._id) {
                            if (weight !== undefined) i.weight = Number(weight);
                            if (status !== undefined) i.status = Number(status);
                            if (type !== undefined) i.type = Number(type);

                            if (title) i.title = title;
                            if (content) i.content = content;
                        }

                        return i;
                    });
                } else {
                    list.push({ weight: Number(weight), title, content, status, type, _id });
                }

                // console.log("update body", value);
            }

 
            data[key] = {
                header, list
            }
            
        } else if (key === "phapLuatBHDC") {

            let { name, shortName, link, _id } = value;
            if (action !== "create") {
                data[key] = data[key].map(i => {

                    if (_id === i._id) {
                        if (name) i.name = name;
                        if (shortName) i.shortName = shortName;
                        if (link !== undefined) {
                            i.link = link;
                        }
                    }

                    return i;
                });
            } else {
                // mặc định list = [] 
                data[key].push({ name, shortName, link, list: [], _id });
            }

        } else if (key === "phapLuatBHDC.dieuKhoan") {
            let { sectionName, sectionIndex, title, content, weight, nghiDinhID, _id } = value;
            // console.log({ sectionName, sectionIndex, title, content, weight, nghiDinhID, _id })
            const _key = key.split(".");
            const nghiDinhTemp = data[_key[0]].find(i => i._id === value.nghiDinhID);
            // console.log({ nghiDinhTemp })

            if (action !== "create") {
                nghiDinhTemp.list = nghiDinhTemp.list.map(i => {

                    if (_id === i._id) {
                        if (sectionName !== undefined) i.sectionName = sectionName;
                        if (sectionIndex !== undefined) i.sectionIndex = Number(sectionIndex);
                        if (title) i.title = title;
                        if (content) i.content = content;
                        if (weight !== undefined) i.weight = Number(weight);
                        if (nghiDinhID) i.nghiDinhID = nghiDinhID;
                    }

                    return i;
                });
                data[_key[0]] = data[_key[0]].map(i => i._id === nghiDinhTemp._id ? { ...nghiDinhTemp } : i);
            } else {

                nghiDinhTemp.list.push({ sectionName, sectionIndex: Number(sectionIndex), title, content, weight: Number(weight), nghiDinhID, _id });
                data[_key[0]] = data[_key[0]].map(i => i._id === nghiDinhTemp._id ? { ...nghiDinhTemp } : i);
            }


        } else if (key === "qAndA") {

            let { index, question, answer, _id } = value;
            if (action !== "create") {
                data[key] = data[key].map(i => {

                    if (_id === i._id) {
                        if (index !== undefined) i.index = Number(index);
                        if (question) i.question = question;
                        if (answer) i.answer = answer;
                    }

                    return i;
                });
            } else {
                data[key].push({ index: Number(index), question, answer, _id });
            }

        } else if (key === "ads") {

            let { link, html, ads_google, _id } = value;
            if (action !== "create") {
                
                if (link !== undefined) data[key].link = link;
                if (html !== undefined) data[key].html = html;
                if (ads_google !== undefined) data[key].ads_google = ads_google;
                
            } else {
                // data[key].push({ index: Number(index), question, answer, _id });
            }

        } else if (key === "daCapCompanyList") {
            data[key] = value;
        } else if (key === "setting") {
            
            data[key] = value;
            let { homeTitle, bannerImgLink, youtubeLink, mlmCompanyListUpdateAt } = value;
            if (action !== "create") {
                
                if (homeTitle != undefined) data[key].homeTitle = homeTitle;
                if (bannerImgLink != undefined) data[key].bannerImgLink = bannerImgLink;
                if (youtubeLink != undefined) data[key].youtubeLink = youtubeLink;
                if (mlmCompanyListUpdateAt != undefined) data[key].mlmCompanyListUpdateAt = mlmCompanyListUpdateAt;
                
            } else {
                // code for create setting.
            }

        }

        _config = data;

        return fse.writeJSONSync(this.fileName, data, { spaces: '\t' });
    }

    deleteWriteFileSync(key, value, data) {
        const keyNormal = ['_id', 'dbVer', 'aboutUs'];
        const { action } = value;
        delete value.created_at;
        delete value.updated_at;
        delete value.is_deleted;

        if (key === "luuYNhaPhanPhoi") {
            let header = data[key].header;
            let list = data[key].list;

            list = list.filter(i => i._id.toString() !== value._id);

            data[key] = {
                header, list
            }
        }
         else if (key === "phapLuatBHDC") {

            // data[key] = data[key].map(i => i._id === value._id ? { ...value, list: i.list } : i);
            data[key] = data[key].filter(i => i._id.toString() !== value._id);
        } 
        else if (key === "phapLuatBHDC.dieuKhoan") {
            const _key = key.split(".");
            const nghiDinhTemp = data[_key[0]].find(i => i._id === value.nghiDinhID);
            
            // console.log({nghiDinhTemp2 : nghiDinhTemp}, {value})
            nghiDinhTemp.list = nghiDinhTemp.list.filter(i => i._id.toString() !== value._id);
            // console.log(nghiDinhTemp.list)
            data[_key[0]] = data[_key[0]].map(i => i._id === nghiDinhTemp._id ? { ...nghiDinhTemp } : i);
        } else if (key === "qAndA") {
            data[key] = data[key].filter(i => i._id.toString() !== value._id);
        }

        _config = data;

        return fse.writeJSONSync(this.fileName, data, { spaces: '\t' });
    }


}


module.exports = CRUDFile;