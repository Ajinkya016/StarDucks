const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: {
        type:  mongoose.ObjectId,
        required: true
    },
    email: {
        type: String,
        required:true
    },
    topic: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    },
})

const Message = new mongoose.model('Message', messageSchema);
module.exports = Message;