const express = require('express');
const companiesController = require('../controllers/companies.controller');
const auth = require('../middleware/auth.middleware');
const router = express.Router();

// GET /api/companies
router.get('/', companiesController.getCompanies);

// GET /api/companies/:slug
router.get('/:slug', companiesController.getCompanyBySlug);

// GET /api/companies/:slug/members
router.get('/:slug/members', auth, companiesController.getCompanyMembers);

// POST /api/companies (admin only)
router.post('/', auth, companiesController.createCompany);

// PATCH /api/companies/:id (admin only)
router.patch('/:id', auth, companiesController.updateCompany);

// DELETE /api/companies/:id (admin only)
router.delete('/:id', auth, companiesController.deleteCompany);

module.exports = router;
