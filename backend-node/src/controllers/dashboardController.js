// src/controllers/dashboardController.js
const { Job, Customer, Staff, Invoice, Payment } = require('../models');
const { Op } = require('sequelize');

exports.getDashboardOverview = async (req, res) => {
  try {
    // Daily jobs (scheduled today)
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dailyJobs = await Job.count({
      where: {
        scheduledAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });

    // Monthly revenue
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenue = await Invoice.sum('total', {
      where: {
        issuedAt: {
          [Op.gte]: firstOfMonth,
          [Op.lt]: tomorrow
        },
        status: 'Paid'
      }
    }) || 0;

    // Unpaid invoices
    const unpaidInvoices = await Invoice.count({ where: { status: 'Unpaid' } });

    // Business performance
    const totalJobs = await Job.count();
    const completedJobs = await Job.count({ where: { status: 'Completed' } });

    res.json({
      dailyJobs,
      monthlyRevenue,
      unpaidInvoices,
      totalJobs,
      completedJobs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// New endpoint: today's schedule grouped by staff
exports.getTodaysSchedule = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayJobs = await Job.findAll({
      where: {
        scheduledAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      },
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: Staff, attributes: ['id', 'name'] }
      ],
      order: [
        ['scheduledAt', 'ASC'],
        [{ model: Staff, as: 'Staff' }, 'name', 'ASC']
      ]
    });
    
    res.json({ jobs: todayJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Overdue jobs (scheduled in the past, not completed)
exports.getOverdueJobs = async (req, res) => {
  try {
    const now = new Date();
    
    const overdueJobs = await Job.findAll({
      where: {
        scheduledAt: { [Op.lt]: now },
        status: { [Op.notIn]: ['Completed', 'Invoiced'] }
      },
      include: [
        { model: Customer, attributes: ['id', 'name', 'phone'] },
        { model: Staff, attributes: ['id', 'name'] }
      ],
      order: [['scheduledAt', 'ASC']]
    });
    
    res.json({ jobs: overdueJobs });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Customer 360: full customer history
exports.getCustomer360 = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, { 
      include: [
        {
          model: Job,
          attributes: ['id', 'service', 'status', 'scheduledAt', 'notes', 'createdAt'],
          include: [
            { model: Staff, attributes: ['id', 'name'] },
            { 
              model: Invoice, 
              attributes: ['id', 'total', 'status', 'issuedAt'],
              include: ['Payment']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });
    
    if (!customer) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      });
    }
    
    res.json(customer);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Job statistics for reporting
exports.getJobStats = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    let whereClause = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }
    
    // Total jobs by status
    const byStatus = await Job.findAll({
      where: whereClause,
      attributes: [
        'status',
        [Job.sequelize.fn('COUNT', Job.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });
    
    // Total revenue by service type
    const revenueByService = await Job.findAll({
      where: whereClause,
      include: [{ model: Invoice, attributes: [] }],
      attributes: [
        'service',
        [Job.sequelize.fn('COALESCE', Job.sequelize.fn('SUM', Job.sequelize.col('Invoices.total')), 0), 'revenue']
      ],
      group: ['service'],
      having: Job.sequelize.where(Job.sequelize.fn('COALESCE', Job.sequelize.fn('SUM', Job.sequelize.col('Invoices.total')), 0), '>', 0)
    });
    
    res.json({
      byStatus,
      revenueByService,
      dateRange: { startDate, endDate }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};