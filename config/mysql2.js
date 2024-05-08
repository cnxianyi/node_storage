const mysql = require('mysql2');
const { globalLogger }  = require("../logger");

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: "password",
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

// 创建数据库 react_storage
connection.query(
    "CREATE DATABASE IF NOT EXISTS react_storage",
    function (error, results, fields) {
        if (error) {
            throw error;
        }
    }
);

// 切换数据库为wr
connection.changeUser({ database: "react_storage" }, function (err) {
    if (err) {
        throw err;
    }
    console.log("use react_storage success!");
});

connection.query(
    `
    CREATE TABLE IF NOT EXISTS user(
        id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL,
        vip BOOLEAN DEFAULT FALSE,
        invite_code VARCHAR(20),
        registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        status ENUM('active', 'disabled') DEFAULT 'active',
        vip_expiry_date DATETIME,
        UNIQUE (username),
        UNIQUE (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `,
    function (error, results, fields) {
        if(error) console.log(error)
    }
);


module.exports = connection;
