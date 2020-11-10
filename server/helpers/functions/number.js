/**
 * Tính tổng mảng json với field key
 * ví dụ: data = [{duration: 15}]
 * key = duration
 */
exports.sumByKey = function (data, key) {
    return data.reduce((pre, cur) => (pre + cur[key]), 0);
};