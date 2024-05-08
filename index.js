const express = require('express')
const path = require('path');
require('module-alias/register');
const app = express()
const port = 3098

const { globalLogger }  = require("./logger");

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencod

// 设置别名，以便于在项目中使用
const aliases = {
  '@': path.resolve(__dirname, './'),
  // 其他别名...
};

require('module-alias').addAliases(aliases);

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

// 跨域

app.all("*", function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "*");
	res.header("Access-Control-Allow-Methods", "*");

	// 允许content-type
	res.header("Access-Control-Allow-Origin", "*");
	// 允许前端请求中包含Content-Type这个请求头
	res.header(
		"Access-Control-Allow-Headers",
		"DNT,X-Mx-ReqToken,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type, X-Custom-Header, Access-Control-Expose-Headers, Token, Authorization"
	);
	res.header("Access-Control-Allow-Credentials", "true");
	next();
});

// ----------------------------------------------------------------

// 路由

const usersRouter = require("./router/user/register");
app.use("/api/users", usersRouter);

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