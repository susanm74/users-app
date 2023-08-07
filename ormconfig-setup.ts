const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const config = {
  "type": "postgres",
  "host": "localhost",
  "port": Number(process.env.DB_PORT),
  "username": process.env.DB_USR,
  "password": process.env.DB_PWD,
  "database": process.env.DB_NAME,
  "entities": ["src/entity/*.ts"],
  "synchronize": true
}

const configFile = 'ormconfig.json';
fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
console.log(`${configFile} successfully configured!`);