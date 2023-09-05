const mysql = require('mysql2');
const { globalLogger }  = require("../logger");

const connection = mysql.createConnection({
    host: '193.32.151.228',
    user: 'root',
    password: "1f3031b8a7cacc06",
	port: 3357,
});

connection.connect(function (err) {
    if (err) {
        //console.error("error connecting: " + err.stack);
        globalLogger.error(JSON.stringify({
            message: `mysql error connecting`,
            error: err.stack
        }))
        return;
    }

    console.log("connected as id " + connection.threadId);
});

module.exports = connection;
