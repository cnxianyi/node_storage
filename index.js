const express = require('express')
const app = express()
const port = 3000

const { globalLogger }  = require("./logger");

function winston(req, res, next){ // 全局日志记录
    globalLogger.info(JSON.stringify({
        message: 'access',
        url: req.baseUrl || req.url,
        method: req.method,
        ip: req.ip,
        headers: req.headers['user-agent'],
    }))
    next()
}

app.use(winston) // 全局日志记录

// ----------------------------------------------------------------

// mysql

const { connection }  = require("./config/mysql2");

// ----------------------------------------------------------------

// 路由
const word = require('./router/word/word')

app.use('/word' , word)

app.get('/', (req, res) => {
    res.json('Hello World!')
})

app.use("/error", (req, res) => { // 指定 error链接
    res.status(404).send('error');
})

app.use("*", (req, res , err) => { // 错误处理：未知请求
    globalLogger.error(JSON.stringify({
        message: '404',
        url: req.baseUrl || req.url,
        method: req.method,
    }))
    res.status(404).json(err);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})