const mongoose = require('mongoose')

const ContactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    email:{
        type:String,
        required: true,
        unique:true,
    },
    phone:{
        type:String,
        required:true,
        trim: true,
    },
    location:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
})

const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact;