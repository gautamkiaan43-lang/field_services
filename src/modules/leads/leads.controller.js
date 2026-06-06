const leadService = require('./leads.service');

const prisma = require('../../config/db');

/**
 * Public Lead Create
 */
const createLead = async (req, res) => {
  try {
    const { token, ...leadData } = req.body;
    
    // Validate token
    if (!token) {
      return res.status(400).json({ success: false, error: 'Form token is required' });
    }
    
    const link = await prisma.publicFormLink.findUnique({ where: { token } });
    if (!link || !link.isActive || (link.expiresAt && new Date() > new Date(link.expiresAt))) {
      return res.status(400).json({ success: false, error: 'Invalid or expired form link' });
    }

    const lead = await leadService.create(leadData);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

/**
 * Admin/Manager Methods
 */
const getAllLeads = async (req, res) => {
  try {
    const leads = await leadService.getAll();
    res.json({ success: true, data: leads });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
};

const getLeadById = async (req, res) => {
  try {
    const lead = await leadService.getById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching lead' });
  }
};

const updateLeadStatus = async (req, res) => {
  try {
    const lead = await leadService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const proposeSchedule = async (req, res) => {
  try {
    const lead = await leadService.proposeSchedule(req.params.id, req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const updateLeadPricing = async (req, res) => {
  try {
    const lead = await leadService.updatePricing(req.params.id, req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const convertToJob = async (req, res) => {
  try {
    const job = await leadService.convertToJob(req.params.id, req.body);
    res.json({ success: true, data: job });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const convertToEstimate = async (req, res) => {
  try {
    const estimate = await leadService.convertToEstimate(req.params.id, req.body);
    res.json({ success: true, data: estimate });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const exportLeads = async (req, res) => {
  try {
    const csv = await leadService.exportLeads();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to export leads' });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const lead = await leadService.updateSchedule(req.params.id, req.body, req.user);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

const customerResponse = async (req, res) => {
  try {
    const lead = await leadService.customerResponse(req.params.id, req.body);
    res.json({ success: true, data: lead });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

module.exports = {
  createLead,
  getAllLeads,
  getLeadById,
  updateLeadStatus,
  proposeSchedule,
  updateLeadPricing,
  convertToJob,
  convertToEstimate,
  exportLeads,
  updateSchedule,
  customerResponse
};
