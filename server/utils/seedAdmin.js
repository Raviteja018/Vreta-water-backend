const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vreta-water');
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Create admin user
        const adminUser = new User({
            username: 'Avinash',
            password: 'Admin@Vreta',
            email: 'avinash@vreta.com',
            fullName: 'Avinash - System Administrator',
            phone: '9876543210',
            role: 'admin',
            department: 'IT',
            position: 'System Administrator',
            status: 'active'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        console.log('Username: Avinash');
        console.log('Password: Admin@Vreta');
        
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        await mongoose.disconnect();
    }
};

// Run the seed function
seedAdmin(); 