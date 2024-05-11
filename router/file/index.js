const connection = require("@/config/mysql2");
const auth = require("@/tools/auth");
const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require("fs");


// 设置静态文件目录
//router.use('/temp', express.static(path.join(__dirname, "../../uploads/temp")));

router.get('/:path', (req, res) => {
  const tempPath = "../../uploads/temp/"
  const filePath = "../../uploads/files/"
  if (req.params.path.slice(0, 4) == 'temp') {
    const Path = path.join(__dirname,
      `${tempPath}${req.params.path}`); // 替换为你的文件路径
    res.download(Path, (err) => {
      if (err) {
        console.error('文件下载失败:', err);
        res.status(404).send('文件未找到');
      } else {
        console.log('文件下载成功');
      }
    });
  } else {
    const Path = path.join(__dirname,
      `${filePath}${req.params.path}`); // 替换为你的文件路径

    connection.query(
      `
        SELECT is_deleted , is_banned , file_name
        FROM files
        WHERE file_index = '${req.params.path}'
      `, (error, results) => {
      if (error) {
        console.log(error);
      } else {
        if (results[0].is_banned === 0 && results[0].is_deleted === 0) {
          const fileName = 'XIANYI-STORAGE-' + decodeURIComponent(escape(results[0].file_name))
          res.download(Path, fileName, (err) => {
            if (err) {
              console.error('文件下载失败:', err);
              res.status(404).send('文件未找到');
            } else {
              console.log(req.params.path);
              // 待优化
              // 1. 通过path解码获取用户...

              const query = "UPDATE files SET download_count = download_count + 1 WHERE file_index = ?";
              connection.query(query, [req.params.path], (error, results) => {
                if (error) {
                  //console.error("更新下载次数失败:", error); // , error);
                } else {
                  //console.log("更新下载次数成功:", results);// , results);
                }
              });
              //console.log('文件下载成功');

            }
          });
        } else {
          res.status(404).json({
            error: "File is no defined"
          })
        }
      }
    })
  }
});

router.post('/list', auth, (req, res) => {
  const query = `SELECT * FROM files WHERE uploader_id = ${req.userInfo.id} ORDER BY created_at DESC`;
  connection.query(query, (error, resultsFiles) => {
    if (error) {
      console.error("获取数据失败:", error);
      res.status(500).json({ error: "获取数据失败" });
    } else {
      //console.log("获取数据成功:", results);
      let size = 0
      resultsFiles.map((item) => {
        console.log(item.file_size);
        size += item.file_size
      })
      connection.query(
        `
        UPDATE users
        SET uploaded_file_size = ${size}
        WHERE id = ${req.userInfo.id}
        `,
        (error, results) => {
          if (error) {
            console.log(error)
          } else {
            res.status(200).json({
              code: 200,
              data: {
                file: resultsFiles,
                user: req.userInfo
              },
              message: "success"
            });
          }
        }
      )
    }
  });
});

router.post('/delete', auth, (req, res) => {
  console.log(req.userInfo.id);
  const query = `UPDATE files
  SET is_deleted = 1
  WHERE id = ${req.body.id}
  AND uploader_id = ${req.userInfo.id}
  AND file_index = '${req.body.file_index}'`
  connection.query(query, (error, results) => {
    if (error) {
      res.status(404).json({
        error: error
      })
    } else {
      if (results.changedRows == 1) {
        const filePath = `uploads/files/${req.body.file_index}`
        // 检查文件是否存在
        fs.access(filePath, fs.constants.F_OK, (err) => {
          if (err) {
            console.error(err);
            return res.status(404).send('File not found');
          }
          // 删除文件
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(err);
              return res.status(500).send('Internal Server Error');
            }
            res.status(200).json({ message: 'File deleted successfully' });
          });
        });

      } else {
        res.status(404).json({
          error: "文件已被删除"
        })
      }
    }
  })


  // const filename = req.params.filename;
  // const filePath = path.join(__dirname, 'your-folder', filename); // 替换 'your-folder' 为你的文件存储路径


});

module.exports = router;
