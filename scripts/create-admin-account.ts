import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminAccount() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
  const lastName = process.env.ADMIN_LAST_NAME || 'User';

  if (!email || !password) {
    console.error('❌ Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables before running this script.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('❌ ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`ℹ️  User ${email} already exists`);
      
      // Update to admin if not already
      if (!existingUser.isAdmin) {
        await prisma.user.update({
          where: { email },
          data: { isAdmin: true },
        });
        console.log(`✅ Granted admin privileges to ${email}`);
      } else {
        console.log(`✅ ${email} is already an admin`);
      }
      
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the admin user
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        accountType: 'INDIVIDUAL',
        gdprConsent: true,
        marketingConsent: false,
        isAdmin: true,
      },
    });

    console.log(`✅ Successfully created admin account!`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${firstName} ${lastName}`);
    console.log(`🔐 Admin privileges: GRANTED`);
    console.log(`📍 You can now login at /login and access /admin`);
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminAccount();
