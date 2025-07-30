const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/manager-login
router.post('/manager-login', async (req, res) => {
    console.log("manager login route hit");
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'manager' });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login safely
    try {
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.log('Could not update last login:', error.message);
        // Continue with login even if last login update fails
    }

    const token = jwt.sign({ role: 'manager', id: user._id }, process.env.JWT_SECRET || 'VretaSecret', { expiresIn: '1h' });
    res.json({ token, message: 'Manager login successful' });
});

// POST /api/auth/employee-login
router.post('/employee-login', async (req, res) => {
    console.log("employee login route hit");
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'employee' });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login safely
    try {
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.log('Could not update last login:', error.message);
        // Continue with login even if last login update fails
    }

    const token = jwt.sign({ role: 'employee', id: user._id }, process.env.JWT_SECRET || 'VretaSecret', { expiresIn: '1h' });
    res.json({ token, message: 'Employee login successful' });
});

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
    console.log("admin login route hit");
    const { username, password } = req.body;
    const user = await User.findOne({ username, role: 'admin' });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login safely
    try {
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.log('Could not update last login:', error.message);
        // Continue with login even if last login update fails
    }

    const token = jwt.sign({ role: 'admin', id: user._id }, process.env.JWT_SECRET || 'VretaSecret', { expiresIn: '1h' });
    res.json({ token, message: 'Admin login successful' });
});

module.exports = router; 









