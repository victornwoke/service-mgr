// src/routes/jobNotes.js
const express = require('express');
const router = express.Router();
const jobNotesController = require('../controllers/jobNotesController');
const { authenticate } = require('../middleware/auth');

// All notes are accessed via job ID
router.get('/jobs/:jobId/notes', authenticate, jobNotesController.getJobNotes);
router.post('/jobs/:jobId/notes', authenticate, jobNotesController.createJobNote);
router.put('/jobs/:jobId/notes/:noteId', authenticate, jobNotesController.updateJobNote);
router.delete('/jobs/:jobId/notes/:noteId', authenticate, jobNotesController.deleteJobNote);

module.exports = router;