const Pool = require('pg').Pool
const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'airi',
  password: 'admin',
  port: 5432,
})

module.exports = db;