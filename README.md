# React_storage

## 需求描述

1. 用户注册
  * 邮箱
  * 密码
  * 邀请码
2. 用户登录
  * 邮箱
  * 密码
3. 文件上传
  * 文件名 上传文件的文件名
  * 文件索引 默认为文件名
  * 文件大小
  * 文件类型 img code zip
  * 文件最大下载次数
  * 文件下载次数
  * 文件上传者 外键，为id
  * 文件是否封禁 是或否
  * 文件是否被删除 是或否
  * 是否记录文件下载IP 是或否
  * 文件是否预览 是或否
  * 文件版本 1.0 默认值

CREATE TABLE IF NOT EXISTS files (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    file_index VARCHAR(255) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    file_type TINYINT UNSIGNED NOT NULL,
    max_download_count INT UNSIGNED DEFAULT 0,
    download_count INT UNSIGNED DEFAULT 0,
    uploader_id INT UNSIGNED,
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

## 服务器监控表

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

## 其他
