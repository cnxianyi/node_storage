const { createLogger, format, transports } = require("winston");

const customFormat = format.combine(
    format.timestamp({ format: "YY-MM-DD HH:mm:ss" }),
    format.align(),
    format.printf((i) => `${i.level}: ${[i.timestamp]}: ${i.message}`)
);

const globalLogger = createLogger({
    format: customFormat,
    transports: [
        new transports.File({
            filename: "logs/info.log",
            level: "info",
            format: format.combine(
                format.printf((i) =>
                    i.level === "info"
                        ? `${i.timestamp}: ${i.message}`
                        : ""
                )
            ),
        }),
        new transports.File({
            filename: "logs/error.log",
            level: "error",
        }),
    ],
});

const nsLog = createLogger({
    format: customFormat,
    transports: [
        new transports.File({
            filename: "logs/ns.log",
            level: "info",
            format: format.combine(
                format.printf((i) =>
                    i.level === "info"
                        ? `${i.timestamp}: ${i.message}`
                        : ""
                )
            ),
        }),
        new transports.File({
            filename: "logs/nsError.log",
            level: "error",
        }),
    ],
});

const authLogger = createLogger({
    transports: [
        new transports.File({
            filename: "logs/authLog.log",
            format: customFormat,
        }),
    ],
});

module.exports = {
    globalLogger: globalLogger,
    authLogger: authLogger,
    nsLog: nsLog,
};