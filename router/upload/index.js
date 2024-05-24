// 文件路径: routes.js

const express = require("express");
const router = express.Router();
const upload = require("@/tools/multer");
const fs = require("fs");
const path = require("path");
const auth = require("@/tools/auth");
const temp = require("@/tools/temp");
const db = require("@/config/mysql2");
const { nsLog } = require("@/logger");


// 添加文件上传路由
router.post('/add', auth, (req, res, next) => {
  // 根据用户是否登录选择不同的上传中间件
  if (req?.locals && !req.locals?.login) {
    temp.single('file')(req, res, (err) => {
      if (err) {
        // 捕获超出文件大小的错误
        return res.status(400).json({
          err: err.message
        });
      } else {
        res.json({
          message: '文件上传成功',
          file: req.file
        });
      }
    });
  } else {
    req.fileInfo = req.file;
    upload.single('file')(req, res, async (err) => {
      if (err) {
        // 捕获超出文件大小的错误
        return res.status(400).json({
          err: err.message
        });
      }
      nsLog.info(req.file)
      const fileName = req.file.originalname;
      const fileSize = req.file.size;
      const fileType = req.file.mimetype; // mimetype: 'application/msword',
      const uploaderId = req.userInfo.id;
      const fileIndex = req.file.filename;
      const sql = `INSERT INTO files (file_name, file_index, file_size, file_type, uploader_id) VALUES (?, ?, ?, ?, ?)`;
      try {
        await db.query(sql, [fileName, fileIndex, fileSize, fileType, uploaderId]);
        res.json({
          message: '文件上传成功',
          file: req.file
        });
      } catch (error) {
        nsLog.error(JSON.stringify({
            message: 'Error inserting file',
            error: error
        }));
        res.status(500).json({
          message: "文件上传失败"
        });
      }
    });
  }
});

// 获取文件列表路由
router.post('/list', (req, res) => {
  const uploadDir = 'uploads/files'; // 上传文件夹的路径
  // 读取上传文件夹中的文件列表
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      nsLog.error(JSON.stringify({
        message: '',
        error: err
    }));
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }
    // 将文件按修改时间从新到旧排序
    files.sort((a, b) => {
      return fs.statSync(path.join(uploadDir, b)).mtime.getTime() -
        fs.statSync(path.join(uploadDir, a)).mtime.getTime();
    });
    // 取最新的5个文件，并为它们添加一个从 0 到 4 的 ID
    const latestFiles = files.slice(0, 5).map((file, index) => {
      return {
        id: index,
        fileName: file
      };
    });
    res.status(200).json({
      message: "success",
      data: latestFiles,
    });
  });
});

module.exports = router;
