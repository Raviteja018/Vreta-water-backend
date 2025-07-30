const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async() => {
    try{
        await mongoose.connect('mongodb+srv://raviteja:Ravi-123@cluster0.apwa1yk.mongodb.net/vretaDB');
    }catch(err){
        console.log('Database connection is failed: '+err.message)
    }
}

module.exports= connectDB;

