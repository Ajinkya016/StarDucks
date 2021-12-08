"use strict"
const jwt = require('jsonwebtoken');
const Register = require('../models/users');

const auth = async (req, res, next) => {
    try {

        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, 'JSONWEBTOKENsecretqwertuiopasdfghjklzxcvbnm');
        const User = await Register.findOne({ _id: verifyUser.id });
        let x = false;

        for (let i = 0; i < User.tokens.length; i++) {
            const element = User.tokens[i].token;

            if (element === token) {
                x = true;
            }
        }

        if (x) {
            req.token = token;
            req.user = User;

            next();
        }
        else {
            res.render("signin");

        }

    } catch (e) {
        res.render("signin");
    }
};

module.exports = auth;