const express = require("express");

const connection = require("@/config/mysql2.js");

const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  
  const raw = req.headers.authorization; // undefined
  if(req.path == '/add'){
    if(raw){
      console.log(raw);
    }else{
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
        // JWT 已过期
        return res.status(401).json({
          code: 401,
          message: "您的会话已过期，请重新登录!"
        });
      }

      try {
        const results = await new Promise((resolve, reject) => {
          connection.query(
            `SELECT id , nickname , email , vip , last_login , status , uploaded_file_size , display
            FROM users
            WHERE email = '${data.email}' AND nickname = '${data.nickname}'`,
            function (error, results, fields) {
              if (error) {
                reject(error);
              }
              resolve(results);
            }
          );
        });

        if (results.length === 1) {
          const user = results[0];

          await new Promise((resolve, reject) => {
            connection.query(
              `
              UPDATE users
              SET last_login = default
              WHERE id = ${user.id}
              `,
              function (updateError, updateResults, updateFields) {
                if (updateError) {
                  reject(updateError);
                }
                resolve();
              }
            );
          });

          req.userInfo = user;
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
          error_more: error
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