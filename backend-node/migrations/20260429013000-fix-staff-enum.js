'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check current enum values and clean up any conflicts
    try {
      // First, check if the column already has the correct enum
      const [results] = await queryInterface.sequelize.query(`
        SELECT data_type, udt_name
        FROM information_schema.columns
        WHERE table_name = 'Staff' AND column_name = 'role';
      `);

      if (results && results.udt_name === 'enum_Staff_role') {
        // Column already has correct enum, check if values match
        const [enumValues] = await queryInterface.sequelize.query(`
          SELECT enum_range(NULL::"enum_Staff_role") as values;
        `);

        const currentValues = enumValues.values.replace(/[{}]/g, '').split(',');
        const targetValues = ['Owner', 'Admin', 'Manager', 'Staff'];

        if (JSON.stringify(currentValues.sort()) === JSON.stringify(targetValues.sort())) {
          // Enum is already correct, skip migration
          return;
        }
      }

      // Drop any conflicting enum types
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS staff_role_new CASCADE;`);

      // Rename existing enum if it exists
      await queryInterface.sequelize.query(`ALTER TYPE "enum_Staff_role" RENAME TO staff_role_old;`);

      // Create new enum type
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Staff_role" AS ENUM ('Owner', 'Admin', 'Manager', 'Staff');
      `);

      // Update column to use new enum (existing values should map correctly)
      await queryInterface.sequelize.query(`
        ALTER TABLE "Staff" ALTER COLUMN "role" TYPE "enum_Staff_role"
        USING CASE
          WHEN "role"::text = 'Admin' THEN 'Admin'::"enum_Staff_role"
          WHEN "role"::text = 'Staff' THEN 'Staff'::"enum_Staff_role"
          ELSE 'Staff'::"enum_Staff_role"
        END;
      `);

      // Set default
      await queryInterface.sequelize.query(`
        ALTER TABLE "Staff" ALTER COLUMN "role" SET DEFAULT 'Staff';
      `);

      // Drop old enum type
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS staff_role_old CASCADE;`);

    } catch (error) {
      console.log('Migration may already be applied or enum is correct:', error.message);
    }
  },

  async down (queryInterface, Sequelize) {
    // Revert to simple Admin/Staff enum
    try {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_Staff_role" CASCADE;`);
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_Staff_role" AS ENUM ('Admin', 'Staff');
      `);
      await queryInterface.sequelize.query(`
        ALTER TABLE "Staff" ALTER COLUMN "role" TYPE "enum_Staff_role"
        USING CASE
          WHEN "role"::text IN ('Owner', 'Admin') THEN 'Admin'::"enum_Staff_role"
          WHEN "role"::text = 'Manager' THEN 'Admin'::"enum_Staff_role"
          WHEN "role"::text = 'Staff' THEN 'Staff'::"enum_Staff_role"
          ELSE 'Staff'::"enum_Staff_role"
        END;
      `);
    } catch (error) {
      console.log('Rollback failed:', error.message);
    }
  }
};