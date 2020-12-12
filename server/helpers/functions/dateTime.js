exports.formatDate = (_date, format = "HH:mm:ss") => {
  let date;
  if (typeof _date === "number") date = new Date(_date);
  else date = _date;
  const fullYear = `${date.getFullYear()}`;
  const month = `0${date.getMonth()}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hours = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const seconds = `0${date.getSeconds()}`.slice(-2);

  return format
    .replace("YYYY", fullYear)
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hours)
    .replace("mm", minutes)
    .replace("ss", seconds);
};

exports.pad = pad;

exports.hms = (secs) => {
  if (!secs) return "--";

  // floor: làm tròn xuống
  // round: làm tròn lên từ 0.5
  var sec = Math.floor(secs);
  var minutes = Math.floor(sec / 60);
  sec = sec % 60;
  var hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  return hours + ":" + pad(minutes) + ":" + pad(sec);
};
exports.hmsToNumber = (value) => {
  if (value === "--" || value === 0 || !value) return 0;
  var time = value.split(":"); // split it at the colons

  // minutes are worth 60 seconds. Hours are worth 60 minutes.
  var seconds = +time[0] * 60 * 60 + +time[1] * 60 + +time[2];
  return seconds;
};

function pad(num) {
  return ("0" + num).slice(-2);
}

/**
 * Lấy tất cả các khoảng thời gian theo query
 * @param {string} startTime Thời gian bắt đầu
 * @param {string} endTime Thời gian kết thúc
 */
exports.genHour = (startTime, endTime) => {
  var hour = [];
  while (endTime >= startTime) {
    hour.push(startTime.format("HH"));
    startTime.add(1, "h")
  }
  return _.uniq(hour);
};
