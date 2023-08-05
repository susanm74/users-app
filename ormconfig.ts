const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  "type": "postgres",
  "host": "localhost",
  "port": 5432,
  "username": process.env.USERNAME,
  "password": process.env.PASSWORD,
  "database": process.env.DATABASE,
  "entities": ["src/entity/*.ts"],
  "synchronize": true
}

const configFile = 'ormconfig.json';
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log(`${configFile} successfully configured!`);