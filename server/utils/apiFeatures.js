const configDB = require('../helpers/constants/configQueryDB');

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    // sap xep
    sort() {
        const optSort = {};
        if (this.queryString.sortBy && this.queryString.sortType) {
            const sortBy = (this.queryString.sortBy).split(',');
            const sortType = (this.queryString.sortType).split(',');
            sortBy.forEach((item, index) => {
                optSort[item] = Number(sortType[index]) || configDB.TYPE_ASC;
            });

        }else {
            optSort[configDB.SORT.BY_DEFAULT] = configDB.SORT.TYPE_DEFAULT;
        }
        this.query = this.query.sort(optSort);
        return this;
    }
    // phan trang
    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || Number(process.env.LIMIT_DOCUMENT_PER_PAGE);
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        this.queryString.page = page;
        this.queryString.limit = limit;
        return this;
    }

    // extra
    async queryExtra() {
        const doc = await this.query;

        return this;
    }
}

module.exports = APIFeatures;