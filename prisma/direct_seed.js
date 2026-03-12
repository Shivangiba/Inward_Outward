const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_ga9CKyr2kUoT@ep-floral-poetry-a17qu6ni-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

async function main() {
    const client = new Client({ connectionString });
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected!');

        console.log('Seeding Roles...');
        // Insert admin role
        await client.query('INSERT INTO "Role" ("RoleName") VALUES (\'admin\') ON CONFLICT ("RoleName") DO NOTHING');
        const adminRole = await client.query('SELECT "RoleID" FROM "Role" WHERE "RoleName" = \'admin\'');
        const adminId = adminRole.rows[0].RoleID;

        // Insert clerk role
        await client.query('INSERT INTO "Role" ("RoleName") VALUES (\'clerk\') ON CONFLICT ("RoleName") DO NOTHING');
        const clerkRole = await client.query('SELECT "RoleID" FROM "Role" WHERE "RoleName" = \'clerk\'');
        const clerkId = clerkRole.rows[0].RoleID;

        console.log('Seeding Users...');
        // Insert admin user
        await client.query(`
            INSERT INTO "User" ("Username", "Name", "Password", "RoleID", "IsActive", "Created") 
            VALUES ('admin@123.com', 'Admin User', 'admin123', $1, true, NOW()) 
            ON CONFLICT ("Username") DO UPDATE SET "Name" = EXCLUDED."Name"
        `, [adminId]);

        // Insert clerk user
        await client.query(`
            INSERT INTO "User" ("Username", "Name", "Password", "RoleID", "IsActive", "Created") 
            VALUES ('clerk@123.com', 'Clerk User', 'clerk123', $1, true, NOW()) 
            ON CONFLICT ("Username") DO UPDATE SET "Name" = EXCLUDED."Name"
        `, [clerkId]);

        console.log('Direct seeding completed successfully!');
    } catch (err) {
        console.error('SEED ERROR:', err);
    } finally {
        await client.end();
    }
}

main();
