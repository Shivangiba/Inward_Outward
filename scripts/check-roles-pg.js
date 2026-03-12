const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_ga9CKyr2kUoT@ep-floral-poetry-a17qu6ni-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function main() {
    await client.connect();
    const res = await client.query('SELECT * FROM "Role" ORDER BY "RoleName" ASC');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
}

main().catch(console.error);
