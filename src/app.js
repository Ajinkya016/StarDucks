"use strict";

require('dotenv').config()
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const JWT = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 4000 - 1000;
const static_path = path.join(__dirname, "../public/");
const alpinejs = path.join(__dirname, "../node_modules/alpinejs/dist/");
const aosPath = path.join(__dirname, "../node_modules/aos/dist/");
const User = require('./models/users');
const Token = require('./models/tokens');
const Message = require('./models/messages');
const auth = require("./middleware/auth");
const admin = require("./middleware/admin");
app.set('view engine', 'ejs');
app.use(express.static(static_path));
app.use(express.static(alpinejs));
app.use(express.static(aosPath));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
require('./db/connection');
const JWTsecretToken = process.env.JWT_SECRET_TOKEN;
const mailSendDetails = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'starduckstps@gmail.com',
        pass: process.env.PASS
    }
});
app.get('/', auth, async (req, res) => {
    res.render('index', {
        TotalUsers: await User.estimatedDocumentCount(),
        _id: req.user._id,
        user: req.user,
        email: req.user.Email
    });
});
app.get('/account', auth, async (req, res) => {
    res.render('account', {
        TotalUsers: await User.estimatedDocumentCount(),
        _id: req.user._id,
        user: req.user,
        email: req.user.Email
    });
});
app.get('/seasons', auth, async (req, res) => {
    res.render('seasons', {
        TotalUsers: await User.estimatedDocumentCount(),
        _id: req.user._id,
        user: req.user,
        email: req.user.Email
    });
});

app.get('/admin', admin, async (req, res) => {
    res.send("adminsONLY")
})
app.get('/terms&conditions', (req, res) => res.render('t&c'));
app.get('/privacyPolicy', (req, res) => res.render('privacyPolicy'));
app.get('/cookiePolicy', (req, res) => res.render('cookiePolicy'));
app.get('/signin', (req, res) => res.render('signin'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/verifyOtp', (req, res) => res.render('verifyOtp'));
app.get('/forgetPassword', (req, res, next) => res.render('forgetPassword'));
app.get('/resetPassword/:_id/:token', async (req, res, next) => {
    try {
        const { _id, token } = req.params;
        const user = await User.findOne({ _id });
        if (user) {
            const secret = JWTsecretToken + user.Password;
            JWT.verify(token, secret, (err, decode) => {
                if (err) {

                    res.render('resetPassword', {
                        status: "error",
                        message: "This link is invalid"
                    });
                } else {
                    res.render('resetPassword', {
                        status: 'success',
                        email: user.Email,
                        path: `/resetPassword/${_id}/${token}`
                    });
                }
            });

        } else {
            res.render('resetPassword', {
                status: "error",
                message: "This link is invalid"
            });
        }
    } catch (e) {
        console.log(e);
    }
});

app.get('/logout', auth, async (req, res) => {
    try {
        const { token, user } = req;
        await Token.deleteOne({ user: user._id, token });
        res.clearCookie('jwt').render('signin');
    } catch (e) {
        console.log(e);
    }
});

app.get('/logoutall', auth, async (req, res) => {
    try {
        const user = req.user;
        await Token.deleteMany({ user: user._id });
        res.clearCookie('jwt').render('signin');
    } catch (e) {
        console.log(e);
    }
});


app.get('*', (req, res) => res.status(404).render('404'));

app.post('/signup', async (req, res) => {
    try {
        const { Firstname, Lastname, Email, DOB, Gender, Password, ConfirmPassword } = req.body;
        const Age = Math.floor(((Date.now() - new Date(DOB)) / (31557600000)));
        const isEmail = await User.find({ Email });
        const errs = [];

        if (isEmail.length >= 1) {
            errs.push('User already exists');
        }

        if (Password !== ConfirmPassword) {
            errs.push('Password are not matching');
        }

        if (Age < 13) {
            errs.push('You are too small for having an account');
        }
        if (errs.length == 0) {
            const code = Math.floor(Math.random() * 90000) + 10000;
            await new User({
                Firstname,
                Lastname,
                Email,
                Password,
                Gender,
                Age,
                DOB,
                Joined_at: new Date(),
                emailVerification: false,
                code
            }).save();
            const mailOptions = {
                from: 'starduckstps@gmail.com',
                to: Email,
                subject: 'Email Verification Code',
                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Email Verification Code is</h3><br/><h1 style="color:#2f6ef7"><b>' + code + '</b></h1>.<br/></br><p>Dear' + Firstname + " " + Lastname + ',your verification code is mentioned above. Don\'t share this with anybody else.<br/>Thanks</p></div>'
            };
            await mailSendDetails.sendMail(mailOptions);
            res.json({
                status: "success",
                message: "You have been registered!"
            });
        } else {
            let resultTxtError = "";
            errs.forEach(element => {
                resultTxtError += element + ',';
            });
            res.json({
                status: "error",
                message: resultTxtError.slice(0, -1)
            });
        }


    } catch (e) {
        res.status(400).send(e);
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { Email, Password } = req.body;
        const user = await User.findOne({ Email });

        if (user) {
            const result = await bcrypt.compare(Password, user.Password);

            if (result) {
                if (user.emailVerification) {
                    const token = JWT.sign({ id: user._id }, JWTsecretToken);

                    const newToken = new Token({
                        user: user._id,
                        token
                    })

                    await newToken.save();
                    res.cookie("jwt", token, {
                        expires: new Date(Date.now() + 7200000),
                        httpOnly: true
                    }).json({
                        status: "success",
                        message: "User logged in successfully"
                    });
                } else {
                    res.json({
                        status: "error",
                        message: "Pls Verify your email address."
                    });
                }
            } else {
                res.json({
                    status: "error",
                    message: "Invalid login Details."
                });
            }
        } else {
            res.json({
                status: "error",
                message: "Invalid login Details."
            });
        }
    } catch (e) {
        console.error(e);
    }
});

app.post('/verifyOtp', async (req, res) => {
    try {
        const { Email, Password, code } = req.body;
        const user = await User.findOne({ Email });

        if (user) {
            const result = await bcrypt.compare(Password, user.Password);

            if (result) {
                if (user.emailVerification) {
                    res.json({
                        status: "error",
                        message: "You Have already verified your account."
                    });
                } else {
                    if (user.code == code) {
                        await User.updateMany({ Email }, { code: 0, emailVerification: true });
                        res.json({
                            status: "success",
                            message: "User verified successfully"
                        });
                    } else {
                        res.json({
                            status: "error",
                            message: "Wrong OTP!"
                        });
                    }
                }
            } else {
                res.json({
                    status: "error",
                    message: "Invalid login details"
                });
            }
        } else {
            res.json({
                status: "error",
                message: "Invalid login details"
            });
        }
    } catch (e) {
        console.error(e);
    }
});

app.post('/forgotPasswprd', async (req, res, next) => {
    try {
        const { Email } = req.body;
        const user = await User.findOne({ Email });
        if (user) {
            const secret = JWTsecretToken + user.Password;
            const payload = {
                id: user._id,
                email: user.Email
            }
            const token = JWT.sign(payload, secret, { expiresIn: '30m' });
            const link = `https://starducks.herokuapp.com/resetPassword/${user._id}/${token}`;
            const mailOptions = {
                from: 'starduckstps@gmail.com',
                to: Email,
                subject: 'Password recovery Code',
                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Password recovery Code is</h3><br/><h2 style="color:#2f6ef7"><b>' + link + '</b></h2>.<br/></br><p>Dear ' + user.Firstname + " " + user.Lastname + ',your password code is mentioned above. Don\'t share this with anybody else.<br/>Thanks</p></div>'
            };
            await mailSendDetails.sendMail(mailOptions);
            res.json({
                status: "sucees",
                message: "Password recovery code sent"
            });
        } else {
            res.json({
                status: "error",
                message: "User with this email does not exist"
            });
        }
    } catch (e) {
        console.error(e);
    }
});


app.post('/resetPassword/:_id/:token', async (req, res) => {
    try {
        const { _id, token } = req.params;
        const { Password, confirmPassword } = req.body;
        const user = await User.findOne({ _id });
        if (user) {
            const secret = JWTsecretToken + user.Password;

            JWT.verify(token, secret, (err, decode) => {
                if (err) {
                    res.json({
                        status: "error",
                        message: "This link is invalid"
                    });
                } else {
                    if (Password == confirmPassword) {

                        user.Password = Password;
                        user.save().then(async () => {
                            const mailOptions = {
                                from: 'starduckstps@gmail.com',
                                to: user.Email,
                                subject: 'Password has been changed',
                                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Password of your account has been changed!</h3></br><p>Dear ' + user.Firstname + " " + user.Lastname + ',Your account\'s password has been changed recently. If you were not it, then we applogise about it. Please delete your account after having backed up your data to ensure safety. <br/>Thanks</p></div>'
                            };
                            await mailSendDetails.sendMail(mailOptions);
                            res.json({
                                status: "succes",
                                message: "Password changed successfully"
                            });
                        }).catch(e => console.log(e));

                    } else {
                        res.json({
                            status: "error",
                            message: "Password must match"
                        });
                    }
                }
            });

        } else {
            res.json({
                status: "error",
                message: "This link is invalid"
            });
        }
    } catch (e) {
        console.log(e);
    }
});

app.post('/newsletter', auth, async (req, res) => {
    try {
        const { email, _id } = req.body;

        const user = await User.findOne({ email });

        if (user) {

            const mailOptions = {
                from: 'starduckstps@gmail.com',
                to: user.Email,
                subject: 'Subscribtion for newsletter',
                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Congratulations! You have successfully subscribed to our newsletter</h3></br><p>Dear ' + user.Firstname + "&nbsp;" + user.Lastname + ',Your account has subscribed to our newsletter. You\'l get the notifications about the new season launches, updates and alerts <br/>Thanks</p></div>'
            };
            user.Subscriber = true;

            await user.save();
            await mailSendDetails.sendMail(mailOptions);

            res.json({
                status: "success",
                message: "You have successfully subscribed to the newsletter of the star ducks"
            });

        } else {
            res.json({
                status: "error",
                message: "You can only subscribe with your regestered email id (" + req.user.Email + ")"
            });
        }

    } catch (e) {
        res.json({
            status: "error",
            message: e
        });
    }
})

app.post('/contactUs', auth, async (req, res) => {
    try {
        const { fullName, topic, message, _id } = req.body;

        const user = await User.findOne({ _id });
        if (user) {
            const email = user.Email;
            const createMessage = new Message({
                user: _id,
                email,
                topic,
                message
            });

            await createMessage.save();
            res.json({
                status: "success",
                message: "Message has been sent. Thank you for contacting us"
            })

        } else {
            res.json({
                status: "error",
                message: "something went wrong"
            });
        }
    } catch (e) {
        console.log(e);
        res.json({
            status: "error",
            message: e
        })
    }

});

app.post('/saveAcc', auth, async (req, res) => {
    try {
        const { about, Firstname, Lastname, DOB, password, Gender, _id } = req.body;
        const Age = Math.floor(((Date.now() - new Date(DOB)) / (31557600000)));

        const user = await User.findOne({ _id });

        if (user) {

            user.About = about;
            user.Firstname = Firstname;
            user.Lastname = Lastname;
            user.DOB = DOB;
            user.Age = Age;
            user.Gender = Gender;
           if(password != "") user.Password = password;

            await user.save();

            res.json({
                status: "success",
                message: "Changes saved successfully!"
            })

        } else {
            res.json({
                status: "error",
                message: "Something went wrong"
            })
        }
    } catch (e) {
        res.json({
            status: "error",
            message: e
        });
    }

});
//Delete request
app.delete('/account', auth, async (req, res) => {
    try {
        const { _id } = req.body;

        console.log(_id);
        await User.deleteOne({ _id });
        await Token.deleteMany({ _id });
        res.json({
            status: "success",
            message: "account deleted successfullt"
        });
    } catch (e) {
        res.json({
            status: "error",
            message: e
        });
    }
});
app.listen(port, () => {
    console.log('Wohoo! yout server has been stated on port', port, "!");
});
