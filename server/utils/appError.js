class AppError {
    constructor({name, message}){
        // super
    this.name = name;
    this.message = message;
    }

    get(){
        return this.name + ' - ' + this.message;
    }
}

module.exports = AppError;