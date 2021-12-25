"use strict"
const jwt = require('jsonwebtoken');
const Register = require('../models/users');
const Token = require('../models/tokens');

const auth = async (req, res, next) => {
    try {

        const token = req.cookies.jwt;
        const verifyUser = jwt.verify(token, process.env.JWT_SECRET_TOKEN);
        const TokenColl = await Token.find({ user: verifyUser.id });
        const User = await Register.findOne({ _id: verifyUser.id });

        if (TokenColl.length == 0) { //which will not happen if the user logs out as we delte the cookie from browser, but if some bug or user error occures, it shall not affect UX
            res.render("signin");

        } else {
            TokenColl.forEach(doc => {
                if (token == doc.token) {
                    if (User.isAdmin) {
                        req.token = token;
                        req.user = User;
                        req.isUser = true;

                        next();
                    } else {
                        res.render("NotAdmin")
                    }

                }
            });
        }


    } catch (e) {
        res.render("signin");
    }
};

module.exports = auth;