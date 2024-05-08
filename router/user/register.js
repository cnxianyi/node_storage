const express = require("express");
const router = express.Router();

const connection = require("@/config/mysql2.js");

const jwt = require("jsonwebtoken");

const fs = require("fs");
const path = require("path");

const axios = require("axios");
const FormData = require("form-data");

const upload = require("@/tools/multer");
const { log } = require("console");

// token 验证中间件
const auth = async (req, res, next) => {
	const raw = req.headers.authorization;

	let id = 0;
	jwt.verify(raw, "临时秘钥", function (err, data) {
		if (err === null) {
			id = data.id;
			req.body.jwtId = id;
			connection.query(
				`SELECT id FROM th_user`,
				function (error, results, fields) {
					if(error) console.log(error)
					for (let i = 0; i <= results.length; i++) {
						if (id == results[i].id) {
							//console.log(id);
							next();

							connection.query(
								`
                                UPDATE th_user
                                SET gmt_modified = default
                                WHERE id = ${id}
                                `
							);

							return; // 需要结束函数
						}
					}

					res.status(401).json({
						code: 401,
						message: "token error 解析失败",
						error: err,
					});
				}
			);
		} else {
			// res.status(error.status || 422);
			res.status(401).json({
				code: 401,
				message: "token error 解析失败",
				error: err,
			});
		}
	});

	//console.log(id);
};

// 注册
router.post("/register", function (req, res, next) {
	//console.log(req.body);

	if (
		req.body.account &&
		req.body.password &&
		typeof req.body.account == "string" &&
		typeof req.body.password == "string" &&
        req.body.account.length >=6 &&
        req.body.password.length >=6
	) {
		//let name = ''
		// if(!req.body.name){
		//     name = '用户' + String(Math.floor(Math.random()*9) + Date.now()).slice(1,10)
		// }
		let token = [];
		addUsers([
			req.body.account,
			req.body.password,
			req.body.school || "武汉文理学院",
			req.body.address || "",
			req.body.name ||
				"用户" +
					String(Math.floor(Math.random() * 9) + Date.now()).slice(1, 10),
			req.body.gender || "无",
			req.body.introduction || "请编辑你的个人简介",
		])
			.then((result) => {
				//console.log(result);

				res.status(200).json({
					account: req.body.account,
					school: req.body.school || "武汉文理学院",
					address: req.body.address || "",
					name:
						req.body.name ||
						"用户" +
							String(Math.floor(Math.random() * 9) + Date.now()).slice(1, 10),
					gender: req.body.gender || "无",
					introduction: req.body.introduction || "请编辑你的个人简介",
					token: result,
					code: 200,
					message: "注册成功",
				});
			})
			.catch((err) => {
				res.status(403).json({
					code: 403,
					message: `${err}`,
				});
			});

		//console.log(token);
	} else {
		res.status(403).json({
			code: 403,
			message: "请求体错误或账号/密码长度需要大于6",
		});
	}
});

//router.use(auth)

/* 获取个人信息. */
router.get("/mine", auth, function (req, res, next) {
	connection.query(
		`SELECT account , school , user_address , user_name , gender,
        profile_img , introduction , id
        FROM th_user
        WHERE id = '${req.body.jwtId}'`,
		function (error, results, fields) {
			if(error) console.log(error)
			res.json({
				code: 200,
				data: results,
			});
		}
	);
});
// 登录
router.post("/login", function (request, res, next) {
	if (request.body.account && request.body.password) {
		connection.query(
			`
            SELECT id , user_name , profile_img FROM th_user
            WHERE account = '${request.body.account}'
            AND password = '${request.body.password}'
    `,
			function (error, results, fields) {
				if(error) console.log(error)
				if (results.length == 0) {
					res.status(422).json({
						code: 422,
						message: "账号或密码错误",
					});
				} else {
					const token = jwt.sign(
						{
							id: results[0].id,
						},
						"临时秘钥"
					);

					res.status(200).json({
						code: 200,
						token: token,
						id: results[0].id,
						name: results[0].user_name,
						profile_img: results[0].profile_img,
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


module.exports = router;
