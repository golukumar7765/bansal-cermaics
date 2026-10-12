const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error("Error: MONGO_URI is not defined in .env file!");
      process.exit(1);
    }
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Ye line server ko immediately rok degi error aane par
    process.exit(1); 
  }
};

module.exports = connectDB;