const express = require("express");
const router = express.Router();

const connection = require("@/config/mysql2.js");

const jwt = require("jsonwebtoken");

const auth = require("@/tools/auth")

// token 验证中间件



// 注册fileRouter
router.post("/register", function (req, res, next) {

  if (
    req.body.email &&
    req.body.password &&
    req.body.confirmPassword &&
    req.body.password === req.body.confirmPassword &&
    req.body.password.length >= 8 && 
    req.body.password.length <= 20
  ) {
    const token = jwt.sign({ email: req.body.email, nickname: req.body.nickname || req.body.email }, 'storage', { expiresIn: '1h' });
    if (req.body.code == 'xianyi') {
      connection.query(
        `
        INSERT INTO users (id , nickname , password , email , vip , invite_code , last_login) 
        VALUES (
        default ,
        '${req.body.nickname || req.body.email}',
        '${req.body.password}' ,
        '${req.body.email}' ,
        1 ,
        'xianiy' ,
        CURRENT_TIMESTAMP)        
          `,
        function (error, results, fields) {
          if (error) {
            res.status(403).json({
              code: 403,
              error: error,
            });
            return
          }

          res.status(200).json({
            data: {
              data: req.body,
              token: token
            },
            code: 200,
            message: "注册成功",
          });
        }
      );

    } else {
      connection.query(
        `
        INSERT INTO users (id , nickname , password , email , vip , invite_code , last_login) 
        VALUES (
        default ,
        '${req.body.nickname || req.body.email}',
        '${req.body.password}' ,
        '${req.body.email}' ,
        0 ,
        '' ,
        CURRENT_TIMESTAMP)        
          `,
        function (error, results, fields) {
          if (error) {
            res.status(403).json({
              code: 403,
              error: error.sqlMessage,
            });
            return
          }

          res.status(200).json({
            data: {
              data: req.body,
              token: token
            },
            code: 200,
            message: "注册成功",
          });
        }
      );
    }


  } else {
    res.status(403).json({
      code: 403,
      error: "账号或密码错误",
    });
  }
});

//router.use(auth)

/* 获取个人信息. */
router.post("/info", auth, function (req, res, next) {
  res.status(200).json({
    code: 200,
    message: "success",
    data: req.userInfo
  });
});
// 登录
router.post("/login", function (req, res, next) {
  if (req.body.email && req.body.password) {
    connection.query(
      `
            SELECT id , nickname , email , vip , last_login , status , uploaded_file_size , display
            FROM users
            WHERE email = '${req.body.email}'
            AND password = '${req.body.password}'
    `,
      function (error, results, fields) {
        if (error) console.log(error)
        if (results.length == 0) {
          res.status(422).json({
            code: 422,
            error: "账号或密码错误",
          });
        } else {

          res.status(200).json({
            code: 200,
            message: `登录成功! 欢迎您 ${results[0].nickname}`,
            token: jwt.sign({ email: results[0].email, nickname: results[0].nickname }, 'storage', { expiresIn: '1h' }),
            data: results[0],
          });
        }
      }
    );
  } else {
    res.status(422).json({
      code: 422,
      message: "请求体错误",
    });
  }
});

// 获取是否密码正确

router.post("/edit/password", auth, function (req, res, next) {
  console.log(req.body.password);
  console.log(req.userInfo);
  const query = `UPDATE users
  SET password = '${req.body.password}'
  WHERE id = ${req.userInfo.id}
  AND password = '${req.body.oldPassword}'`
  connection.query(query , function (error, results, fields) {
    if(error) console.log(error);
    if (results.changedRows == 1) {
      res.status(200).json({
        code: 200,
        message: "success",
      });
    }else{
      res.status(403).json({
        code: 403,
        error: "原密码错误",
      });
    }
  })
  
});


module.exports = router;
