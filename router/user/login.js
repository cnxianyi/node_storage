const express = require("express");
const router = express.Router();
const db = require("@/config/mysql2.js");
const jwt = require("jsonwebtoken");
const auth = require("@/tools/auth");
const { nsLog } = require("@/logger");

// 注册路由
router.post("/register", async (req, res) => {
  const { email, password, confirmPassword, code, nickname } = req.body;

  if (email && password && confirmPassword && password === confirmPassword && password.length >= 8 && password.length <= 20) {
    const token = jwt.sign({ email, nickname: nickname || email }, 'storage', { expiresIn: '1h' });

    const query = `
      INSERT INTO users (id, nickname, password, email, vip, invite_code, last_login)
      VALUES (default, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

    const params = [
      nickname || email,
      password,
      email,
      code === 'xianyi' ? 1 : 0,
      code === 'xianyi' ? 'xianiy' : ''
    ];

    try {
      await db.query(query, params);
      res.status(200).json({
        data: { data: req.body, token },
        code: 200,
        message: "注册成功",
      });
    } catch (error) {
      res.status(403).json({
        code: 403,
        error: error.sqlMessage || error.message,
      });
    }
  } else {
    res.status(403).json({
      code: 403,
      error: "账号或密码错误",
    });
  }
});

// 获取个人信息
router.post("/info", auth, (req, res) => {
  res.status(200).json({
    code: 200,
    message: "success",
    data: req.userInfo
  });
});

// 登录
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(422).json({
        code: 422,
        message: "请求体错误",
      });
    }
  
    const query = `
      SELECT id, nickname, email, vip, last_login, status, uploaded_file_size, display
      FROM users
      WHERE email = ? AND password = ?
    `;
    const params = [email, password];
  
    try {
      const results = await db.query(query, params);
      if (results.length === 0) {
        return res.status(422).json({
          code: 422,
          error: "账号或密码错误",
        });
      }
  
      const user = results[0];
      res.status(200).json({
        code: 200,
        message: `登录成功! 欢迎您 ${user.nickname}`,
        token: jwt.sign({ email: user.email, nickname: user.nickname }, 'storage', { expiresIn: '1h' }),
        data: user,
      });
  
    } catch (error) {
      nsLog.error(JSON.stringify({
        message: '服务器错误',
        error: error
      }));
      res.status(500).json({
        code: 500,
        error: "服务器错误",
      });
    }
  });

// 修改密码
router.post("/edit/password", auth, async (req, res) => {
  const { password, oldPassword } = req.body;
  const { id } = req.userInfo;

  const query = `
    UPDATE users
    SET password = ?
    WHERE id = ? AND password = ?
  `;
  const params = [password, id, oldPassword];

  try {
    const results = await db.query(query, params);
    if (results.changedRows === 1) {
      res.status(200).json({
        code: 200,
        message: "success",
      });
    } else {
      res.status(403).json({
        code: 403,
        error: "原密码错误",
      });
    }
  } catch (error) {
    nsLog.error(JSON.stringify({
        message: '服务器错误',
        error: error
    }));
    res.status(500).json({
      code: 500,
      error: "服务器错误",
    });
  }
});

module.exports = router;
