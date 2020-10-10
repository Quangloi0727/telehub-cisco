const { createLogger, format, transports } = require("winston");
require('winston-daily-rotate-file');

const { formatDate } = require("../helpers/functions");
const { combine, timestamp, label, printf,  } = format;

module.exports = (basename) => {
    const myFormat = printf(({ level, message, label, timestamp }) => {
        let t = new Date(timestamp);
        let timeNow = formatDate(t, 'YYYY-MM-DD HH:mm:ss');
        const timeZone = t.getTimezoneOffset() / 60;
        return `${timeNow} ${timeZone}Z [${label}] ${basename} ${level}: ${message}`;
    });
    
    const combineF = combine(
        label({ label: 'debug' }),
        timestamp(),
        myFormat,
        format.colorize(),
        format.align(),
    );

    
    const logger = createLogger({
        level: 'debug',
        format: combineF,
        defaultMeta: { service: 'user-service' },
        exceptionHandlers: (e) =>{
            console.log({e})
        },
        transports: [
    
            new transports.DailyRotateFile({
                filename: 'logs/error-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d', level: 'error'
            }),
            new transports.DailyRotateFile({
                filename: 'logs/info-%DATE%.log',
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d', level: 'info'
            }),
        ],
    });
    
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new transports.Console({
            format: combineF,
        }));
    }

    return logger;
};