const express = require('express');
const ContactRouter = express.Router();
const Contact = require('../models/Customer');

ContactRouter.get("/all", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
    console.log(contacts)
  } catch (err) {
    res.status(400).json({ message: "failed to fetch contacts" });
  }
});

// Get leads by status
ContactRouter.get("/status/:status", async (req, res) => {
  try {
    const { status } = req.params;
    const contacts = await Contact.find({ status }).sort({ lastUpdated: -1 });
    res.status(200).json(contacts);
  } catch (err) {
    res.status(400).json({ message: "failed to fetch contacts by status" });
  }
});

// Update lead status
ContactRouter.patch("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      { 
        status, 
        notes: notes || '',
        lastUpdated: new Date() 
      },
      { new: true }
    );
    
    if (!updatedContact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    res.status(200).json(updatedContact);
  } catch (err) {
    res.status(400).json({ message: "failed to update contact status" });
  }
});

// Get lead statistics
ContactRouter.get("/stats", async (req, res) => {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formattedStats = {
      total: 0,
      new: 0,
      contacted: 0,
      'follow-up': 0,
      closed: 0
    };
    
    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });
    
    res.status(200).json(formattedStats);
  } catch (err) {
    res.status(400).json({ message: "failed to fetch statistics" });
  }
});

module.exports = ContactRouter;
