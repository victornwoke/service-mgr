// src/controllers/reportingController.js
const { Job, Invoice, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get weekly job counts for the last N weeks
 * GET /api/v1/reporting/jobs-per-week?weeks=12
 */
exports.getJobsPerWeek = async (req, res) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks) || 12, 52);
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - weeks * 7);

    // Group jobs by week (starting Monday)
    const weeklyData = await Job.findAll({
      where: { createdAt: { [Op.gte]: startDate } },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt')), 'weekStart'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'week', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Transform to array of { weekStart: 'YYYY-MM-DD', count: N }
    res.json({ weeks: weeklyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to generate weekly job report'
    });
  }
};

/**
 * Get revenue by service
 * GET /api/v1/reporting/revenue-by-service?startDate=2024-01-01&endDate=2024-12-31
 */
exports.getRevenueByService = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { status: 'Paid' };
    if (startDate || endDate) {
      where.issuedAt = {};
      if (startDate) where.issuedAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.issuedAt[Op.lte] = end;
      }
    }

    const revenue = await Invoice.findAll({
      where,
      include: [{ model: sequelize.models.Job, attributes: ['service'] }],
      attributes: [
        'service',
        [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'invoiceCount']
      ],
      group: ['service'],
      order: [[sequelize.fn('SUM', sequelize.col('total')), 'DESC']],
      raw: true
    });

    res.json({ revenue });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to generate revenue report'
    });
  }
};

/**
 * Get job status distribution
 * GET /api/v1/reporting/jobs-by-status
 */
exports.getJobsByStatus = async (req, res) => {
  try {
    const distribution = await Job.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      order: [['status', 'ASC']],
      raw: true
    });

    res.json({ distribution });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Failed to generate job status report'
    });
  }
};