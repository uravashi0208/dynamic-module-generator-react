require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const injectDbName = (uri, dbName) => {
  if (/\/\/[^/]+\/[^/?]+(\?|$)/.test(uri)) return uri;
  if (uri.includes('?')) return uri.replace('/?', `/${dbName}?`);
  return uri.replace(/\/?$/, `/${dbName}`);
};

const seed = async () => {
  const DB_NAME = process.env.DB_NAME || 'dynamic_module_gen';
  const uri = injectDbName(process.env.MONGODB_URI, DB_NAME);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log(`✅ Connected to DB: "${mongoose.connection.name}"`);

  const User = require('../models/User');

  // Delete existing admin and recreate fresh (fixes double-hash issue)
  await User.deleteOne({ email: 'admin@admin.com' });
  console.log('🗑️  Old admin removed (if existed)');

  // Create user through Mongoose model — pre('save') hook will hash the password ONCE
  const admin = new User({
    name: 'Super Admin',
    email: 'admin@admin.com',
    password: 'Admin@123456',   // plain text — model hashes it via pre-save hook
    role: 'admin',
    isActive: true,
  });

  await admin.save();

  console.log('✅ Admin seeded successfully!');
  console.log('   Email:    admin@admin.com');
  console.log('   Password: Admin@123456');
  console.log('   DB:      ', mongoose.connection.name);
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
