import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('Error: MONGO_URI is not defined in environment variables.');
      return; // Don't crash immediately, but DB features won't work
    }
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error.message.includes('IP that isn\'t whitelisted') || error.message.includes('Could not connect to any servers')) {
      console.error('\n' + '='.repeat(50));
      console.error('MONGODB CONNECTION ERROR: IP NOT WHITELISTED');
      console.error('To fix this, go to your MongoDB Atlas Dashboard:');
      console.error('1. Go to "Network Access"');
      console.error('2. Click "Add IP Address"');
      console.error('3. Select "Allow Access From Anywhere" (0.0.0.0/0) for development');
      console.error('4. Click "Confirm" and wait a minute for it to apply.');
      console.error('='.repeat(50) + '\n');
    }
    console.error(`Error: ${error.message}`);
    // Removed process.exit(1) to allow server to stay online even if DB is down
  }
};

export default connectDB;
