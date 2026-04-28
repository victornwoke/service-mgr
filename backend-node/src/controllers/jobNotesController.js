// src/controllers/jobNotesController.js
const { JobNote, Job, Staff } = require('../models');
const { auditLog } = require('../services/auditService');
const Joi = require('joi');

const jobNoteSchema = Joi.object({
  content: Joi.string().min(1).required(),
  staffId: Joi.number().integer().positive().allow(null),
  isSystemGenerated: Joi.boolean().default(false)
});

const handleError = (res, err) => {
  console.error(err);
  if (err.isJoi) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: err.details.map(d => d.message)
    });
  }
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

exports.getJobNotes = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }
    const notes = await JobNote.findAll({
      where: { jobId },
      include: [{ model: Staff, attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(notes);
  } catch (err) {
    handleError(res, err);
  }
};

exports.createJobNote = async (req, res) => {
  try {
    const { error, value } = jobNoteSchema.validate(req.body);
    if (error) throw error;

    const { jobId } = req.params;
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Job not found' });
    }

    const note = await JobNote.create({
      ...value,
      jobId
    });

    const noteWithStaff = await JobNote.findByPk(note.id, {
      include: [{ model: Staff, attributes: ['id', 'name', 'email'] }]
    });

    // Audit log
    await auditLog({
      userId: req.user?.id || null,
      action: 'CREATE',
      entityType: 'JobNote',
      entityId: note.id,
      changes: { content: value.content },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json(noteWithStaff);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateJobNote = async (req, res) => {
  try {
    const { error, value } = Joi.object({
      content: Joi.string().min(1).required()
    }).validate(req.body);
    if (error) throw error;

    const note = await JobNote.findByPk(req.params.noteId);
    if (!note) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Note not found' });
    }

    const old = note.content;
    await note.update(value);

    await auditLog({
      userId: req.user?.id || null,
      action: 'UPDATE',
      entityType: 'JobNote',
      entityId: note.id,
      changes: { content: { old, new: value.content } },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    const updated = await JobNote.findByPk(note.id, {
      include: [{ model: Staff, attributes: ['id', 'name', 'email'] }]
    });
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteJobNote = async (req, res) => {
  try {
    const note = await JobNote.findByPk(req.params.noteId);
    if (!note) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Note not found' });
    }
    await note.destroy();
    await auditLog({
      userId: req.user?.id || null,
      action: 'DELETE',
      entityType: 'JobNote',
      entityId: note.id,
      changes: { deleted: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
};