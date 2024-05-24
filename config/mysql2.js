const mysql = require('mysql2/promise');
const { nsLog } = require('../logger');

// 创建连接池
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password',
    port: 3357,
    waitForConnections: true,
    connectionLimit: 9,
    queueLimit: 0,
    idleTimeout: 30000
});

// 获取连接并执行查询
async function query(sql, params) {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows, fields] = await connection.query(sql, params);
            return rows;
        } finally {
            connection.release();
        }
    } catch (err) {
        nsLog.error(JSON.stringify({
            message: `mysql query error`,
            error: err.stack
        }));
        throw err;
    }
}

// 直接执行不支持预处理语句的查询
async function directQuery(sql) {
    try {
        const connection = await pool.getConnection();
        try {
            const [rows, fields] = await connection.query(sql);
            return rows;
        } finally {
            connection.release();
        }
    } catch (err) {
        nsLog.error(JSON.stringify({
            message: `mysql direct query error`,
            error: err.stack
        }));
        throw err;
    }
}

// 定期发送心跳包
setInterval(async () => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        nsLog.info('Ping successful');
    } catch (err) {
        nsLog.error(JSON.stringify({
            message: 'Ping failed',
            error: err.stack
        }));
    }
}, 30000); // 每30秒发送一次心跳包

// 创建数据库并切换到目标数据库
(async () => {
    try {
        await directQuery("CREATE DATABASE IF NOT EXISTS react_storage");
        nsLog.info('Database react_storage created or already exists');

        await directQuery("USE react_storage");
        nsLog.info('Switched to database react_storage');

        // 分别执行创建表和插入数据的语句
        await query(`
            CREATE TABLE IF NOT EXISTS administrators (
                id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL
            );
        `);
        await query(`
            INSERT IGNORE INTO administrators (username, password)
            VALUES ('admin', 'password');
        `);
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                nickname VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) NOT NULL,
                vip TINYINT UNSIGNED DEFAULT 0,
                invite_code VARCHAR(20),
                registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('active', 'disabled') DEFAULT 'active',
                vip_expiry_date DATETIME,
                uploaded_file_size INT UNSIGNED DEFAULT 0,
                UNIQUE (email),
                display VARCHAR(255) DEFAULT ''
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        await query(`
            CREATE TABLE IF NOT EXISTS files (
                id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                file_name VARCHAR(255) NOT NULL,
                file_index VARCHAR(255) NOT NULL,
                file_size INT UNSIGNED NOT NULL,
                file_type VARCHAR(20) NOT NULL,
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
        `);
        await query(`
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
        `);
        nsLog.info('Tables created and initial data inserted');
        console.log('mysql start');
    } catch (err) {
        nsLog.error(JSON.stringify({
            message: 'Failed to create database or tables',
            error: err.stack
        }));
        throw err;
    }
})();

module.exports = {
    query,
    directQuery
};
