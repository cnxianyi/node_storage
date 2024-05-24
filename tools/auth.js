const db = require("@/config/mysql2.js");
const { nsLog, authLogger } = require("@/logger");
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  const raw = req.headers.authorization;
  
  if (req.path == '/add') {
    if (raw) {
      nsLog.info(raw);
    } else {
      req.locals = { login: false };
      return next();
    }
  }

  if (!raw || !raw.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      error: "Authorization error"
    });
  }

  const token = raw.slice(7);

  jwt.verify(token, "storage", async function (err, data) {
    if (err === null) {
      const currentTime = Math.floor(Date.now() / 1000); // 当前时间的时间戳（单位秒）
      if (data.exp < currentTime) {
        return res.status(401).json({
          code: 401,
          message: "您的会话已过期，请重新登录!"
        });
      }

      try {
        const results = await db.query(
          `SELECT id, nickname, email, vip, last_login, status, uploaded_file_size, display
           FROM users
           WHERE email = ? AND nickname = ?`,
          [data.email, data.nickname]
        );

        if (results.length === 1) {
          const user = results[0];

          await db.query(
            `UPDATE users
             SET last_login = DEFAULT
             WHERE id = ?`,
            [user.id]
          );

          req.userInfo = user;
          authLogger.info(`${user.nickname} active in ${req.path}`);

          return next();
        } else {
          return res.status(401).json({
            code: 401,
            message: "token error 解析失败",
            error: "用户不存在"
          });
        }
      } catch (error) {
        return res.status(401).json({
          code: 401,
          error: "token error 解析失败",
          error_more: error.message
        });
      }
    } else {
      return res.status(401).json({
        code: 401,
        error: "token error 解析失败",
      });
    }
  });
};

module.exports = auth;
