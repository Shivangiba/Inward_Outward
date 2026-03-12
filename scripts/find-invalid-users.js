const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
    const offices = await pool.query('SELECT "userId" FROM "InwardOutwardOffice"');
    const userIds = offices.rows.map(o => o.userId);
    console.log('UserIDs in Office:', userIds);

    const users = await pool.query('SELECT "UserID" FROM "User"');
    const validUserIds = users.rows.map(u => u.UserID);
    console.log('Valid UserIDs in User table:', validUserIds);

    const invalid = userIds.filter(id => !validUserIds.includes(id));
    console.log('Invalid UserIDs:', invalid);

    await pool.end();
}

main().catch(console.error);
