const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

router.post('/', async(req, res) => {
    try{
        const {fullName, email, phone, location} = req.body;
        if(!fullName || !email || !phone || !location){
            return res.status(400).json({error: "input fields are need to be filled"})
        }
        const customer = new Customer({fullName, email, phone, location});
        const savedCustomer = await customer.save();
        console.log(savedCustomer);
        res.status(201).json({message:'Details submitted successfully.', customer:savedCustomer});
    }catch(err){
        console.error('Contact form error: ',err.message);
        res.status(400).json({error:'Server error while saving customer details.'})
    }
})

module.exports = router;









