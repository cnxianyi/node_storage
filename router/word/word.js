const express = require('express');
const Router = express.Router();

Router.get('/' , (req , res) => {
    res.json('word');
})

module.exports = Router;