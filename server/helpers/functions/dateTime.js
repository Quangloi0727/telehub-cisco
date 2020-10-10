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
