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

connection.query( // 管理员表
    `
    CREATE TABLE IF NOT EXISTS administrators (
      id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    `,
    function (error, results, fields) {
        if(error) console.log(error)
    }
);

connection.query( // 添加管理员
    `
    INSERT IGNORE INTO administrators (username, password) VALUES ('admin', 'password');
    `,
    function (error, results, fields) {
        if(error) console.log(error)
    }
);


connection.query( // 用户表
    `
    CREATE TABLE IF NOT EXISTS users (
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
      uploaded_file_size INT UNSIGNED DEFAULT 0,
      UNIQUE (username),
      UNIQUE (email),
      display VARCHAR(255) DEFAULT ''
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;  
    `,
    function (error, results, fields) {
        if(error) console.log(error)
    }
);

connection.query( // 文件表
  `
  CREATE TABLE IF NOT EXISTS files (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    file_index VARCHAR(255) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    file_type TINYINT UNSIGNED NOT NULL,
    max_download_count INT UNSIGNED DEFAULT 0,
    download_count INT UNSIGNED DEFAULT 0,
    uploader_id BIGINT UNSIGNED,
    FOREIGN KEY (uploader_id) REFERENCES users(id),
    is_banned TINYINT(1) DEFAULT 0,
    is_deleted TINYINT(1) DEFAULT 0,
    record_download_ip TINYINT(1) DEFAULT 1,
    allow_preview TINYINT(1) DEFAULT 0,
    file_version VARCHAR(10) DEFAULT '1.0',
    last_accessed_at DATETIME,
    cloud TINYINT(1) DEFAULT 1,
    expiration_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
  `,
  function (error, results, fields) {
      if(error) console.log(error)
  }
);

connection.query( // 监控表
  `
  CREATE TABLE IF NOT EXISTS server_usage (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    daily_uploads INT UNSIGNED DEFAULT 0,
    total_uploaded INT UNSIGNED DEFAULT 0,
    daily_uploaded_size INT UNSIGNED DEFAULT 0,
    total_uploaded_size BIGINT UNSIGNED DEFAULT 0,
    total_downloads INT UNSIGNED DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
  `,
  function (error, results, fields) {
      if(error) console.log(error)
  }
);


module.exports = connection;
