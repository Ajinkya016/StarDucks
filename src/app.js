"use strict";

//require all dependencies
const express = require('express');
const app = express();
const path = require('path');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const JWT = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3000;
const static_path = path.join(__dirname, "../public");
const toastifyPath = path.join(__dirname, "../node_modules/toastify-js/src/");
const sweetalertPath = path.join(__dirname, "../node_modules/sweetalert2/dist/");
const User = require('./models/users');
const auth = require("./middleware/auth");//needed to secure page from unauthorized people i.e. those who didn't log in/

//middleware and extra stuff
app.set('view engine', 'ejs');//template/view engine is "EJS"
app.use(express.static(static_path));
app.use(express.static(toastifyPath));
app.use(express.static(sweetalertPath));
app.use(express.json());
app.use(cookieParser());//to get value of cookie
app.use(express.urlencoded({ extended: false }));
require('./db/connection'); // connect the database (mongodb)

//Json Web Token secret key, basically from .env file
const JWTsecretToken = 'JSONWEBTOKENsecretqwertuiopasdfghjklzxcvbnm';

//mail details
const mailSendDetails = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ajinkya.kamble016@gmail.com', //your email here
        pass:'rkjegynfsppydend' //your password here. note: you DON'T have to put your ACTUAL password. Google gives different 15 digit password for this purpose.
    }
});

//GET method routes.
app.get('/', auth, (req, res) => res.render('index'));
app.get('/signin', (req, res) => res.render('signin'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/verifyOtp', (req, res) => res.render('verifyOtp'));
app.get('/forgetPassword', (req, res, next) => res.render('forgetPassword'));
app.get('/resetPassword/:_id/:token', async (req, res, next) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //get the parameters of the url (node gives us facility to get custom url with help of ":" symbol i.e. ":id" or ":token" in this case.)
        const { _id, token } = req.params;

        //Get the user
        const user = await User.findOne({ _id });

        //check if the user with the id exists or not
        if (user) {
            //if user is true i.e. user with that id exists, then check the secret. NOTE: THIS SECRET IS DIFFERENT FROM JETsecretToken variable. pls go through line number 219 and 316 of this code, i.e. ./app.js
            const secret = JWTsecretToken + user.Password;

            //verify token
            JWT.verify(token, secret, (err, decode) => {
                if (err) {
                    //if token is not matching with the secret, throw error.
                    //this error may occur if id is valid one but token is wrong or of another user.
                    res.render('resetPassword', {
                        status: "error",
                        message: "This link is invalid"
                    });
                } else {
                    //SUCCESS!!!
                    res.render('resetPassword', {
                        status: 'success',
                        email: user.Email,
                        path: `/resetPassword/${_id}/${token}`
                    });
                }
            });

        } else {
            //if user is false i.e. user with that id DOES NOT exist,then send error message
            res.render('resetPassword', {
                status: "error",
                message: "This link is invalid"
            });
        }
    } catch (e) {
        console.log(e); //if anything goes wrong, but nothing will go as "await document.findOne()" returns boolean
    }
});

app.get('/logout',auth, async (req, res) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //clear cookie
        res.clearCookie('jwt');
        //filter the token from database also.
        req.user.tokens = req.user.tokens.filter(currElem => currElem.token !== req.token);


        // //save the new user with the token removed
        const ll = await req.user.save();
        console.log(ll);
        res.render('signin')
    } catch (e) {
        res.send(500).send(e)
    }
});

app.get('/logoutall', auth, async (req, res) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //clear cookie
        res.clearCookie('jwt');
        //filter the token from database also.
        req.user.tokens = [];

        //save the new user with the token removed
        await req.user.save();
        console.log('logged out successfully');

        res.render('signin')
    } catch (e) {
        res.send(500).send(e)
    }
});


//POST method routes

app.post('/signup', async (req, res) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //Get the credentials
        const { Firstname, Lastname, Email, DOB, Gender, Password, ConfirmPassword } = req.body;
        const Age = Math.floor(((Date.now() - new Date(DOB)) / (31557600000)));//calculate the age from DOB
        const isEmail = await User.find({ Email }); //Find out weather the email is already in use or not

        const errs = [];//make an array containing errors, by default there are no errors. errors will increment in this array.
        if (isEmail.length >= 1) {
            errs.push('User already exists');
        }

        if (Password !== ConfirmPassword) {
            errs.push('Password are not matching');
        }

        if (Age < 13) {
            errs.push('You are too small for having an account');
        }

        //if no errors are there:
        if (errs.length == 0) {
            //generate a random code for email verification purpose
            const code = Math.floor(Math.random() * 90000) + 10000;

            //register an usr with the details provided
            const newUser = new User({
                Firstname,// like Ajinkya
                Lastname,//like Kamble
                Email,// like (are you interested in knowing my email?)
                Password,
                Gender,
                Age,
                Joined_at: new Date(),
                emailVerification: false,
                code
            });

            //prepare the mail
            const mailOptions = {
                from: 'ajinkya.kamble016@email.com',
                to: Email,
                subject: 'Email Verification Code',
                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Email Verification Code is</h3><br/><h1 style="color:#2f6ef7"><b>' + code + '</b></h1>.<br/></br><p>Dear' + Firstname + " " + Lastname + ',your verification code is mentioned above. Don\'t share this with anybody else.<br/>Thanks</p></div>'// plain text body
            };

            //mail the user and save the new user. NOTE: ERRORS will be displayed
            await newUser.save();
            await mailSendDetails.sendMail(mailOptions);
            

            //SUCCESS!
            res.json({
                status: "success",
                message: "You have been registered!"
            });
        } else {
            //if there are error(s). works perfectly fine with single error also.
            let resultTxtError = "";
            errs.forEach(element => {
                resultTxtError += element + ',';  //store errors in STRING
            });

            //send error
            res.json({
                status: "error",
                message: resultTxtError.slice(0, -1) //to remove extra "," at end just to ensure no empty element is created when we convert string to array.
            });
        }


    } catch (e) {
        res.status(400).send(e);
    }
});

app.post('/signin', async (req, res) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //Get the credentials
        const { Email, Password } = req.body;

        //Find the user
        const user = await User.findOne({ Email });

        if (user) {
            //if user with that email exists, then, compare the password of user with the one in database
            const result = await bcrypt.compare(Password, user.Password);

            if (result) {
                //if password matches, then, check if the email is verified or not
                if (user.emailVerification) {
                    //if the email is verified, then, generate authentication token for the user, in order to keep the user logged in and secure the secret pages
                    const token = await user.generateAuthToken(JWTsecretToken);//function mentioned in ./models/users.js

                    //store the token in cookie
                    res.cookie("jwt", token, {
                        expires: new Date(Date.now() + 900000), // expires in : your time in miliseconds
                        httpOnly: true //no scripting language can chenge the cookie for eg: JavaScript (vanilla)
                    }).json({
                        //SUCCESS!
                        status: "success",
                        message: "User logged in successfully"
                    });
                } else {
                    //if the email is NOT verified, then, send error
                    res.json({
                        status: "error",
                        message: "Pls Verify your email address."
                    });
                }
            } else {
                //if password do not match
                res.json({
                    status: "error",
                    message: "Invalid login Details."
                });
            }
        } else {
            //if user with the email does not exists, then, send error
            res.json({
                status: "error",
                message: "Invalid login Details."
            });
        }
    } catch (e) {
        //anything goes wrong, will come here. for eg: error in generating jsonwebtoken
        console.error(e);
    }
});

app.post('/verifyOtp', async (req, res) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //Get the credentials
        const { Email, Password, code } = req.body;

        //find the user
        const user = await User.findOne({ Email });

        if (user) {
            //if user with that email exists, then, compare the password of user with the one in database
            const result = await bcrypt.compare(Password, user.Password);

            if (result) {
                //if password matches, then, check if the email is verified or not
                if (user.emailVerification) {
                    //if the user is already verified, send error
                    res.json({
                        status: "error",
                        message: "You Have already verified your account."
                    });
                } else {
                    //if user is not verified, then, check the otp (one time password) sent to him in mail
                    if (user.code == code) {
                        //if otp matches, then, verify the user
                        await User.updateMany({ Email }, { code: 0, emailVerification: true });

                        //SUCCESS!
                        res.json({
                            status: "success",
                            message: "User verified successfully"
                        });
                    } else {
                        //if otp does not match, send error
                        res.json({
                            status: "error",
                            message: "Wrong OTP!"
                        });
                    }
                }
            } else {
                //if password do not match
                res.json({
                    status: "error",
                    message: "Invalid login details"
                });
            }
        } else {
            //if user with the email does not exists, then, send error
            res.json({
                status: "error",
                message: "Invalid login details"
            });
        }
    } catch (e) {
        // rather not say
        console.error(e);
    }
});

app.post('/forgotPasswprd', async (req, res, next) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //get credentials (ONLY email in this case)
        const { Email } = req.body;

        //find the user
        const user = await User.findOne({ Email });
        if (user) {
            //if user with that email exists, then, make a secret with previous jsonwebtoken secret to make it secure. 
            const secret = JWTsecretToken + user.Password;

            //make the jwt info
            const payload = {
                id: user._id,
                email: user.Email
            }

            //create a token with jwt info ( make it expire in 30minutes);
            const token = JWT.sign(payload, secret, { expiresIn: '30m' });

            //generate a link from user's id and token
            const link = `http://127.0.0.1:${port}/resetPassword/${user._id}/${token}`;
            console.log(link);
            //send the mail
            const mailOptions = {
                from: 'ajinkya.kamble016@email.com',
                to: Email,
                subject: 'Password recovery Code',
                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Password recovery Code is</h3><br/><h2 style="color:#2f6ef7"><b>' + link + '</b></h2>.<br/></br><p>Dear ' + user.Firstname + " " + user.Lastname + ',your password code is mentioned above. Don\'t share this with anybody else.<br/>Thanks</p></div>'// plain text body
            };
            await mailSendDetails.sendMail(mailOptions);

            //SUCCESS!
            res.json({
                status: "sucees",
                message: "Password recovery code sent"
            });
        } else {
            //if user with the email does not exists, then, send error
            res.json({
                status: "error",
                message: "User with this email does not exist"
            });
        }
    } catch (e) {
        console.error(e);
    }
});


app.post('/resetPassword/:_id/:token', async (req, res, next) => {
    //Always put your code in try - catch block to see if everything is working smoothly or not. sometimes the code is right but the request may have fault, so just to be free from it use this habbit.
    try {
        //get the variables used in url
        const { _id, token } = req.params;
        //get credentials
        const { Password, confirmPassword } = req.body;

        //check user
        const user = await User.findOne({ _id });
        if (user) {
            //if user with email exists, then check the jwt token from the link
            const secret = JWTsecretToken + user.Password;//unique jwt secret with normal secret and password

            JWT.verify(token, secret, (err, decode) => {
                //callback used to ensure we send invalid link error if err gets true. We could do it in catch block also, but this is more systimatic and error would be sent only for THIS issue.
                if (err) {
                    //if something go wrong, i.e. wrong secret etc.
                    res.json({
                        status: "error",
                        message: "This link is invalid"
                    });
                } else {
                    //If there is no error, then, check that the paswords match or not. We can do this at client side also, but better we check everything at one place, and backend is only possible.
                    if (Password == confirmPassword) {

                        user.Password = Password;//change the user's data

                        /*** save the changed user data. NOTE: Use .save() method ONLY i.e. not doucment.updateMany(), etc 
                        as we hash the password before updating it in database from "pre" method in ./models/users.js. 
                        if we do from other method, we'll need to rewrite the code of hash again to make it secure. ***/
                        user.save().then(async () => {
                            //send the mail
                            const mailOptions = {
                                from: 'ajinkya.kamble016@email.com',
                                to: user.Email,
                                subject: 'Password has been changed',
                                html: '<div stye="width:100%;height: 100%; padding:50px; font-family: sans-serif;"><h3>Password of your account has been changed!</h3></br><p>Dear ' + user.Firstname + " " + user.Lastname + ',Your account\'s password has been changed recently. If you were not it, then we applogise about it. Please delete your account after having backed up your data to ensure safety. <br/>Thanks</p></div>'// plain text body
                            };
                            await mailSendDetails.sendMail(mailOptions);

                            //SUCCESS!
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
            //if user with the id does not exist, then, send error
            res.json({
                status: "error",
                message: "This link is invalid"
            });
        }
    } catch (e) {
        console.log(e);
    }
})


app.listen(port, () => {
    console.log('Wohoo! yout server has been stated on port', port, "!");
});
