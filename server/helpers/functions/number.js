/**
 * Tính tổng mảng json với field key
 * ví dụ: data = [{duration: 15}]
 * key = duration
 */
exports.sumByKey = function (data, key) {
    return data.reduce((pre, cur) => (pre + cur[key]), 0);
};

/**
 * Tính tổng mảng json với field key
 * ví dụ: data = [{duration: 15}]
 * key = duration
 */
exports.percentFormat = function(_number1, _number2) {
    if(_number2 == 0) return '0 %';
    let _number = _number1/_number2;
    return `${_number ? parseFloat((_number * 100).toFixed(2)) : _number} %`;
}

/**
 * Làm tròn số avagate: làm tròn lên
 * ví dụ: number = 2.4
 * result = 2
 * ví dụ: number = 2.51
 * result = 3
 */
exports.roundAvg = function(number) {
    return Math.round(number);
}