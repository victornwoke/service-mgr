'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Staff', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      role: { 
        type: Sequelize.ENUM('Admin', 'Staff'), 
        defaultValue: 'Staff', 
        allowNull: false 
      },
      passwordHash: { type: Sequelize.STRING(255), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('Customers', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      phone: { type: Sequelize.STRING(20) },
      address: { type: Sequelize.TEXT },
      notes: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('Services', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      description: { type: Sequelize.TEXT },
      defaultRate: { type: Sequelize.DECIMAL(10, 2) },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('Jobs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      customerId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Customers', key: 'id' } },
      staffId: { type: Sequelize.INTEGER, references: { model: 'Staff', key: 'id' } },
      service: { type: Sequelize.STRING(100), allowNull: false },
      status: { 
        type: Sequelize.ENUM('Pending', 'Quote', 'Booked', 'In Progress', 'Completed', 'Invoiced'), 
        defaultValue: 'Pending', 
        allowNull: false 
      },
      scheduledAt: { type: Sequelize.DATE },
      notes: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('JobNotes', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      jobId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Jobs', key: 'id' }, onDelete: 'CASCADE' },
      staffId: { type: Sequelize.INTEGER, references: { model: 'Staff', key: 'id' } },
      content: { type: Sequelize.TEXT, allowNull: false },
      isSystemGenerated: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('Invoices', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      jobId: { type: Sequelize.INTEGER, allowNull: false, unique: true, references: { model: 'Jobs', key: 'id' } },
      total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      status: { type: Sequelize.ENUM('Paid', 'Unpaid'), defaultValue: 'Unpaid', allowNull: false },
      issuedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      pdfUrl: { type: Sequelize.STRING(255) },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('Payments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      invoiceId: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Invoices', key: 'id' } },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      method: { type: Sequelize.STRING(50) },
      paidAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('Tasks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      type: { type: Sequelize.STRING(50), allowNull: false },
      payload: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      status: { 
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed'), 
        defaultValue: 'pending', 
        allowNull: false 
      },
      retryCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      lastError: { type: Sequelize.TEXT },
      scheduledAt: { type: Sequelize.DATE, allowNull: false },
      startedAt: { type: Sequelize.DATE },
      completedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    await queryInterface.createTable('AuditLogs', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      userId: { type: Sequelize.INTEGER },
      action: { type: Sequelize.STRING(50), allowNull: false },
      entityType: { type: Sequelize.STRING(50), allowNull: false },
      entityId: { type: Sequelize.INTEGER, allowNull: false },
      changes: { type: Sequelize.JSONB },
      ipAddress: { type: Sequelize.STRING(45) },
      userAgent: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Indexes for performance
    await queryInterface.addIndex('Jobs', ['customerId']);
    await queryInterface.addIndex('Jobs', ['staffId']);
    await queryInterface.addIndex('Jobs', ['status']);
    await queryInterface.addIndex('Jobs', ['scheduledAt']);
    await queryInterface.addIndex('JobNotes', ['jobId']);
    await queryInterface.addIndex('JobNotes', ['staffId']);
    await queryInterface.addIndex('Invoices', ['status']);
    await queryInterface.addIndex('AuditLogs', ['entityType', 'entityId']);
    await queryInterface.addIndex('AuditLogs', ['userId']);
    await queryInterface.addIndex('AuditLogs', ['createdAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('AuditLogs');
    await queryInterface.dropTable('Tasks');
    await queryInterface.dropTable('Payments');
    await queryInterface.dropTable('Invoices');
    await queryInterface.dropTable('JobNotes');
    await queryInterface.dropTable('Jobs');
    await queryInterface.dropTable('Services');
    await queryInterface.dropTable('Customers');
    await queryInterface.dropTable('Staff');
  }
};