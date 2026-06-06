const prisma = require('../../config/db');

exports.generateLink = async (req, res) => {
  try {
    const { name, expiresAt } = req.body;
    
    const link = await prisma.publicFormLink.create({
      data: {
        name: name || 'Generated Link',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      }
    });
    
    res.status(201).json({ success: true, data: link });
  } catch (error) {
    console.error('Error generating link:', error);
    res.status(500).json({ success: false, message: 'Failed to generate link' });
  }
};

exports.validateLink = async (req, res) => {
  try {
    const { token } = req.params;
    
    const link = await prisma.publicFormLink.findUnique({
      where: { token }
    });
    
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }
    
    if (!link.isActive) {
      return res.status(400).json({ success: false, message: 'Link is inactive' });
    }
    
    if (link.expiresAt && new Date() > new Date(link.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Link has expired' });
    }
    
    res.json({ success: true, data: { isValid: true } });
  } catch (error) {
    console.error('Error validating link:', error);
    res.status(500).json({ success: false, message: 'Failed to validate link' });
  }
};
