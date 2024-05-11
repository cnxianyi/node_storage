const multer = require("multer");
const path = require('path');
const fs = require('fs');

const tempDir = path.join(__dirname, '../uploads', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/')
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, 'temp' + '-' + Date.now() + ext);
  }
});

const temp = multer({
  storage: storage,
  limits:{
    fileSize: 5120 * 1000,
    files: 1
  }
});

module.exports = temp;
