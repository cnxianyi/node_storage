// 文件路径: routes.js

const express = require("express");
const router = express.Router();
const upload = require("@/tools/multer");
const fs = require("fs");
const path = require("path");
const auth = require("@/tools/auth");
const db = require("@/config/mysql2");
const { nsLog } = require("@/logger");

// 设置静态文件目录
//router.use('/temp', express.static(path.join(__dirname, "../../uploads/temp")));

// 文件下载路由
router.get('/:path', async (req, res) => {
  const tempPath = "../../uploads/temp/";
  const filePath = "../../uploads/files/";
  
  if (req.params.path.slice(0, 4) === 'temp') {
    const Path = path.join(__dirname, `${tempPath}${req.params.path}`);
    res.download(Path, (err) => {
      if (err) {
        nsLog.error(JSON.stringify({
            message: '文件下载失败',
            error: err
        }));
        res.status(404).send('文件未找到');
      } else {
        nsLog.info('文件下载成功');
      }
    });
  } else {
    const Path = path.join(__dirname, `${filePath}${req.params.path}`);
    try {
      const results = await db.query(`
        SELECT is_deleted, is_banned, file_name
        FROM files
        WHERE file_index = ?
      `, [req.params.path]);

      if (results.length > 0 && results[0].is_banned === 0 && results[0].is_deleted === 0) {
        const fileName = 'XIANYI-STORAGE-' + decodeURIComponent(escape(results[0].file_name));
        res.download(Path, fileName, async (err) => {
          if (err) {
            nsLog.error(JSON.stringify({
                message: '文件下载失败',
                error: err
            }));
            res.status(404).send('文件未找到');
          } else {
            nsLog.info(req.params.path);
            // 更新下载次数
            try {
              await db.query(`
                UPDATE files
                SET download_count = download_count + 1
                WHERE file_index = ?
              `, [req.params.path]);
            } catch (updateError) {
              nsLog.error(JSON.stringify({
                message: '更新下载次数失败',
                error: updateError
            }));
            }
          }
        });
      } else {
        res.status(404).json({
          error: "File is not defined"
        });
      }
    } catch (error) {
      nsLog.error(JSON.stringify({
        message: 'Internal Server Error',
        error: error
    }));
      res.status(500).json({
        error: "Internal Server Error"
      });
    }
  }
});

// 获取文件列表路由
router.post('/list', auth, async (req, res) => {
  try {
    const resultsFiles = await db.query(`
      SELECT * FROM files
      WHERE uploader_id = ?
      ORDER BY created_at DESC
    `, [req.userInfo.id]);

    let size = 0;
    resultsFiles.forEach((item) => {
      size += item.file_size;
    });

    await db.query(`
      UPDATE users
      SET uploaded_file_size = ?
      WHERE id = ?
    `, [size, req.userInfo.id]);

    res.status(200).json({
      code: 200,
      data: {
        file: resultsFiles,
        user: req.userInfo
      },
      message: "success"
    });
  } catch (error) {
    nsLog.error(JSON.stringify({
        message: '获取数据失败',
        error: error
    }));
    res.status(500).json({
      error: "获取数据失败"
    });
  }
});

// 删除文件路由
router.post('/delete', auth, async (req, res) => {
  try {
    const results = await db.query(`
      UPDATE files
      SET is_deleted = 1
      WHERE id = ? AND uploader_id = ? AND file_index = ?
    `, [req.body.id, req.userInfo.id, req.body.file_index]);

    if (results.changedRows === 1) {
      const filePath = path.join(__dirname, `../../uploads/files/${req.body.file_index}`);
      // 检查文件是否存在
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          nsLog.error(JSON.stringify({
            message: 'files File not found',
            error: err
        }));
          return res.status(404).send('File not found');
        }
        // 删除文件
        fs.unlink(filePath, (err) => {
          if (err) {
            nsLog.error(JSON.stringify({
                message: 'Internal Server Error',
                error: err
            }));
            return res.status(500).send('Internal Server Error');
          }
          res.status(200).json({ message: 'File deleted successfully' });
        });
      });
    } else {
      res.status(404).json({
        error: "文件已被删除"
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

module.exports = router;
