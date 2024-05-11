const multer = require("multer");
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const tempDir = path.join(__dirname, '../uploads', 'files');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// 加密函数
function sha1Hash(input) {
  const hash = crypto.createHash('sha1');
  hash.update(input);
  return hash.digest('hex');
}

// 解密函数
function sha1Verify(input, hashedInput) {
  const hash = crypto.createHash('sha1');
  hash.update(input);
  const hashedInputToVerify = hash.digest('hex');
  return hashedInput === hashedInputToVerify;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/files/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = sha1Hash(req.userInfo.nickname + '-' + Date.now() + ext)
    cb(null,name  + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 限制文件大小
    files: 1 // 限制文件数量
  },
  fileFilter: function (req, file, cb) {
    if (file.size > 500 * 1024 * 1024) {
      // 如果文件大小超过限制，则拒绝这个文件
      console.log(file.size);
      cb(new Error("File size exceeds limit"), false);
    } else {
      // 文件大小符合要求，接受这个文件
      cb(null, true);
    }
  }
});

module.exports = upload;
