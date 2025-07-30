const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Customer = require('../models/Customer');
const Contact = require('../models/contactModel');
const jwt = require('jsonwebtoken');

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'VretaSecret');
        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// GET /api/admin/dashboard - Get admin dashboard statistics
router.get('/dashboard', verifyAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
        const activeUsers = await User.countDocuments({ status: 'active', role: { $ne: 'admin' } });
        const inactiveUsers = await User.countDocuments({ status: 'inactive', role: { $ne: 'admin' } });
        const totalCustomers = await Customer.countDocuments();
        const totalContacts = await Contact.countDocuments();
        const totalEmployees = await User.countDocuments({ role: 'employee' });
        const totalManagers = await User.countDocuments({ role: 'manager' });

        // Get recent customers
        const recentCustomers = await Customer.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recent contacts
        const recentContacts = await Contact.find()
            .sort({ createdAt: -1 })
            .limit(5);

        // Get recent users (excluding admins)
        const recentUsers = await User.find({ role: { $ne: 'admin' } })
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                totalCustomers,
                totalContacts,
                totalEmployees,
                totalManagers
            },
            recentCustomers,
            recentContacts,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/users - Get all users (excluding admins)
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/customers - Get all customers
router.get('/customers', verifyAdmin, async (req, res) => {
    try {
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
    
// GET /api/admin/contacts - Get all contact form submissions
router.get('/contacts', verifyAdmin, async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/users - Create new user
router.post('/users', verifyAdmin, async (req, res) => {
    try {
        const { username, password, email, fullName, phone, role = 'employee', department = 'General', position = 'Staff' } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { username: username.trim() }, 
                ...(email ? [{ email: email.trim() }] : []) 
            ] 
        });

        if (existingUser) {
            if (existingUser.username === username.trim()) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            if (email && existingUser.email === email.trim()) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        // Create new user
        const user = new User({
            username: username.trim(),
            password: password, // Will be hashed by pre-save hook
            email: email ? email.trim() : undefined,
            fullName: fullName ? fullName.trim() : undefined,
            phone: phone ? phone.trim() : undefined,
            role: ['manager', 'employee'].includes(role) ? role : 'employee',
            department: department || 'General',
            position: position || 'Staff',
            status: 'active',
            isActive: true
        });

        // Save user (password will be hashed by pre-save hook)
        await user.save();
        
        // Prepare response without sensitive data
        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.__v;

        res.status(201).json({
            message: 'User created successfully',
            user: userResponse
        });
    } catch (error) {
        console.error('Error creating user:', error);
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                error: `A user with this ${field} already exists` 
            });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                error: 'Validation error',
                details: messages 
            });
        }
        
        res.status(500).json({ 
            error: 'Server error while creating user',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// PUT /api/admin/users/:id - Update user
router.put('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { username, email, fullName, phone, role, department, position, status } = req.body;
        
        const updateData = {
            username,
            email,
            fullName,
            phone,
            role,
            department,
            position,
            status
        };

        // Remove undefined fields
        Object.keys(updateData).forEach(key => 
            updateData[key] === undefined && delete updateData[key]
        );

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/admin/users/:id/status - Toggle user status (active/inactive)
router.patch('/users/:id/status', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.status = user.status === 'active' ? 'inactive' : 'active';
        user.isActive = user.status === 'active';
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/users/:id - Delete user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/users/:id - Get specific user
router.get('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/search - Search users, customers, and contacts
router.get('/search', verifyAdmin, async (req, res) => {
    try {
        const { query, type } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        let results = {};

        if (!type || type === 'users') {
            const users = await User.find({
                role: { $ne: 'admin' },
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { fullName: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            }).select('-password');
            results.users = users;
        }

        if (!type || type === 'customers') {
            const customers = await Customer.find({
                $or: [
                    { fullName: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                    { phone: { $regex: query, $options: 'i' } }
                ]
            });
            results.customers = customers;
        }

        if (!type || type === 'contacts') {
            const contacts = await Contact.find({
                $or: [
                    { firstName: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } },
                    { phone: { $regex: query, $options: 'i' } }
                ]
            });
            results.contacts = contacts;
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/admin/analytics - Get analytics data
router.get('/analytics', verifyAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));

        // User registration analytics
        const userRegistrations = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Customer registration analytics
        const customerRegistrations = await Customer.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        // Role distribution
        const roleDistribution = await User.aggregate([
            {
                $group: {
                    _id: "$role",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Location distribution for customers
        const locationDistribution = await Customer.aggregate([
            {
                $group: {
                    _id: "$location",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Contact form submissions analytics
        const contactSubmissions = await Contact.aggregate([
            {
                $match: {
                    createdAt: { $gte: daysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json({
            userRegistrations,
            customerRegistrations,
            contactSubmissions,
            roleDistribution,
            locationDistribution
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 