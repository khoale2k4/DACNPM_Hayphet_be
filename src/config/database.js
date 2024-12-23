
const { Sequelize } = require('sequelize');
require('dotenv').config();
const db = require('../models/index.js');
import mysql2 from 'mysql2'; 


const {HOST, DATABASE, DB_USERNAME, DB_PASSWORD} = process.env;
const sequelize = new Sequelize(DATABASE, DB_USERNAME, DB_PASSWORD, {
  host: HOST,
  dialect:'mysql',
  dialectModule: mysql2,
});


let connectDB = async() => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database.');
    await db.sequelize.sync({
      // alter: true, // Alter the tables by adding new columns
      // force:true, // Drop all tables and create new ones
      logging: false // Disable logging
    })
      .then(()=>{ console.log('Database synchronized.')})
      .catch(err => console.error('Error:', err));
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}
module.exports = connectDB;