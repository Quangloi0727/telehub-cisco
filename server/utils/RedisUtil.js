const client = require("redis");

class RedisUtil {

    constructor() {
        this.instance = client.createClient();
        this.client = client;
    }

    get instanceClient() {
        return this.instance;
    }

    set instanceClient(instance) {
        this.instance = instance
    }
}


module.exports = RedisUtil;