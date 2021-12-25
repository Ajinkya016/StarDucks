const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    user: {
        type:  mongoose.ObjectId,
        required: true
    },
    token: {
        type: String,
        required: true
    },
    expire_at: {type: Date, default: Date.now, expires: 7200} 
})

const Token = new mongoose.model('Token', tokenSchema);
module.exports = Token;