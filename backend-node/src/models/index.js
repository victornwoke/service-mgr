// src/models/index.js
// Sequelize initialization and model loader
const { Sequelize } = require('sequelize');

const DB_HOST = process.env.DB_HOST || 'postgres-service';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_NAME = process.env.DB_NAME || 'sbms';
const DB_USER = process.env.DB_USER || 'sbmsuser';
const DB_PASS = process.env.DB_PASS || 'sbmspassword';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false,
});

// Import models
const Customer = require('./Customer')(sequelize);
const Job = require('./Job')(sequelize);
const Staff = require('./Staff')(sequelize);
const Invoice = require('./Invoice')(sequelize);
const Payment = require('./Payment')(sequelize);
const Task = require('./Task')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);
const Service = require('./Service')(sequelize);
const JobNote = require('./JobNote')(sequelize);

// Define associations
Customer.hasMany(Job, { foreignKey: 'customerId' });
Job.belongsTo(Customer, { foreignKey: 'customerId' });

Job.belongsTo(Staff, { foreignKey: 'staffId' });
Staff.hasMany(Job, { foreignKey: 'staffId' });

Job.hasOne(Invoice, { foreignKey: 'jobId' });
Invoice.belongsTo(Job, { foreignKey: 'jobId' });

Invoice.hasMany(Payment, { foreignKey: 'invoiceId' });
Payment.belongsTo(Invoice, { foreignKey: 'invoiceId' });

Job.hasMany(JobNote, { foreignKey: 'jobId' });
JobNote.belongsTo(Job, { foreignKey: 'jobId' });

JobNote.belongsTo(Staff, { foreignKey: 'staffId' });
Staff.hasMany(JobNote, { foreignKey: 'staffId' });

module.exports = {
  sequelize,
  Customer,
  Job,
  Staff,
  Invoice,
  Payment,
  Task,
  AuditLog,
  Service,
  JobNote,
};
