// src/services/taskService.js
const { Task, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a new background task
 * @param {string} type - Task type (e.g., 'job_reminder', 'follow_up')
 * @param {object} payload - Task-specific data
 * @param {Date} scheduledAt - When task should execute
 * @returns {Promise<Task>}
 */
exports.createTask = async ({ type, payload, scheduledAt }) => {
  return await Task.create({
    type,
    payload,
    scheduledAt,
    status: 'pending'
  });
};

/**
 * Schedule a reminder for an upcoming job
 * Called when job is created/updated with a future scheduledAt
 */
exports.scheduleJobReminder = async (jobId, scheduledAt, hoursBefore = 2) => {
  const reminderTime = new Date(new Date(scheduledAt).getTime() - hoursBefore * 60 * 60 * 1000);
  if (reminderTime <= new Date()) return; // already passed

  await Task.create({
    type: 'job_reminder',
    payload: { jobId },
    scheduledAt: reminderTime,
    status: 'pending'
  });
};

/**
 * Schedule a follow‑up after job completion
 */
exports.scheduleFollowUp = async (jobId, daysAfter = 1) => {
  const runAt = new Date();
  runAt.setDate(runAt.getDate() + daysAfter);

  await Task.create({
    type: 'follow_up',
    payload: { jobId },
    scheduledAt: runAt,
    status: 'pending'
  });
};

/**
 * Get next pending task for worker
 */
exports.getNextTask = async () => {
  const now = new Date();
  return await Task.findOne({
    where: {
      status: { [Op.in]: ['pending', 'failed'] },
      scheduledAt: { [Op.lte]: now }
    },
    order: [['scheduledAt', 'ASC']]
    // Transaction/locking should be handled at the worker level if needed
  });
};