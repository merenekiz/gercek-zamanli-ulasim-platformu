import { sequelize } from '../config/database';
import User from '../models/User';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';

/**
 * Seed initial test user
 */
async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Check if test user already exists
    const existingUser = await User.findOne({ where: { email: 'test@test.com' } });

    if (existingUser) {
      console.log('✅ Test user already exists');
      return;
    }

    // Create test user
    const testUser = await User.create({
      email: 'test@test.com',
      password: 'test1234',
      name: 'Test User',
      phone: '+905551234567',
      role: UserRole.USER,
      isActive: true,
      isEmailVerified: true,
    });

    console.log('✅ Test user created successfully');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test1234');
    console.log('👤 User ID:', testUser.id);

    // Create admin user
    const existingAdmin = await User.findOne({ where: { email: 'admin@admin.com' } });

    if (!existingAdmin) {
      const adminUser = await User.create({
        email: 'admin@admin.com',
        password: 'admin1234',
        name: 'Admin User',
        phone: '+905557654321',
        role: UserRole.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });

      console.log('✅ Admin user created successfully');
      console.log('📧 Email: admin@admin.com');
      console.log('🔑 Password: admin1234');
      console.log('👤 Admin ID:', adminUser.id);
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('🎉 Database seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seed();
