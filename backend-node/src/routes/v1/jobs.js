// src/routes/jobs.js
const express = require('express');
const router = express.Router();
const jobsController = require('../../controllers/jobsController');

router.get('/', jobsController.getAllJobs);
router.get('/:id', jobsController.getJobById);
router.post('/', jobsController.createJob);
router.put('/:id', jobsController.updateJob);
router.patch('/:id', jobsController.updateJob);
router.delete('/:id', jobsController.deleteJob);

module.exports = router;
