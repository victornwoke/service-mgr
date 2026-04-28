'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove default constraint first
    await queryInterface.sequelize.query(`
      ALTER TABLE "Staff" ALTER COLUMN "role" DROP DEFAULT;
    `);
    // Create new enum type
    await queryInterface.sequelize.query(`
      CREATE TYPE staff_role_new AS ENUM ('Owner', 'Admin', 'Manager', 'Staff');
    `);
    // Alter column to use new type, preserving data
    await queryInterface.sequelize.query(`
      ALTER TABLE "Staff" 
      ALTER COLUMN "role" TYPE staff_role_new 
      USING "role"::text::staff_role_new;
    `);
    // Set new default
    await queryInterface.sequelize.query(`
      ALTER TABLE "Staff" ALTER COLUMN "role" SET DEFAULT 'Staff';
    `);
    // Drop old enum type
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "Staff_role";`);
  },

  async down (queryInterface, Sequelize) {
    // Revert to old enum (Admin, Staff)
    await queryInterface.sequelize.query(`
      ALTER TABLE "Staff" ALTER COLUMN "role" DROP DEFAULT;
    `);
    await queryInterface.sequelize.query(`
      CREATE TYPE staff_role_old AS ENUM ('Admin', 'Staff');
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Staff" 
      ALTER COLUMN "role" TYPE staff_role_old 
      USING "role"::text::staff_role_old;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE "Staff" ALTER COLUMN "role" SET DEFAULT 'Staff';
    `);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS staff_role_new;`);
  }
};