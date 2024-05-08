const multer = require("multer");

const upload = multer({
    limits:{
        fileSize: 5120*1000,
        files: 1
    },
	dest: "uploads/imgs/",
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + '.'
        + file.originalname.split('.').pop())
    }
});

module.exports = upload;
