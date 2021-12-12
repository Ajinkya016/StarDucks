const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    Firstname: {
        type: String,
        required: true
    },
    Lastname: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    Password: {
        type: String,
        required: true
    },
    Gender: {
        type: String,
        required: true
    },
    Age: {
        type: Number,
        required: true
    },
    Joined_at: {
        type: Date,
        required: true
    },
    emailVerification: {
        type: Boolean,
        required: false
    },
    code: {
        type: Number,
        required:true
    }
});

userSchema.pre("save", async function (next) {
    if(this.isModified('Password')){
       this.Password = await bcrypt.hash(this.Password, 12);
    }
    next();
})

const User = new mongoose.model('User', userSchema);
module.exports = User;