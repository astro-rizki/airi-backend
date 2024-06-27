const Pool = require('pg').Pool
const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DB || 'airi',
  user: process.env.DB_UNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
})

module.exports = db;