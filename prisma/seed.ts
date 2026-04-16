import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- Starting Seed Script ---');

    // 1. Roles
    console.log('Seeding Roles...');
    const roles = await prisma.role.findMany();
    const legacySuperAdmin = roles.find(r => r.RoleName.toLowerCase() === 'superadmin' || r.RoleName.toLowerCase() === 'super admin');

    const superAdminRole = await prisma.role.upsert({
        where: { RoleName: 'Super Admin' },
        update: {},
        create: { RoleName: 'Super Admin' },
    });

    if (legacySuperAdmin && legacySuperAdmin.RoleID !== superAdminRole.RoleID) {
        console.log(`Migrating users from ${legacySuperAdmin.RoleName} to Super Admin...`);
        await prisma.user.updateMany({
            where: { RoleID: legacySuperAdmin.RoleID },
            data: { RoleID: superAdminRole.RoleID }
        });
        await prisma.role.delete({ where: { RoleID: legacySuperAdmin.RoleID } });
    }

    const adminRole = await prisma.role.upsert({
        where: { RoleName: 'admin' },
        update: {},
        create: { RoleName: 'admin' },
    });

    const clerkRole = await prisma.role.upsert({
        where: { RoleName: 'clerk' },
        update: {},
        create: { RoleName: 'clerk' },
    });

    // 2. Teams
    console.log('Seeding Teams...');
    const generalTeam = await prisma.team.upsert({
        where: { TeamName: 'General' },
        update: {},
        create: { TeamName: 'General' },
    });

    // 3. Users
    console.log('Seeding Users...');
    const superAdmin = await prisma.user.upsert({
        where: { Email: 'super@123.com' },
        update: {},
        create: {
            Email: 'super@123.com',
            Password: 'super123', // In a real app, this should be hashed
            RoleID: superAdminRole.RoleID,
            Name: 'Super Admin',
            TeamID: generalTeam.TeamID,
        },
    });

    const adminUser = await prisma.user.upsert({
        where: { Email: 'admin@123.com' },
        update: {},
        create: {
            Email: 'admin@123.com',
            Password: 'admin123',
            RoleID: adminRole.RoleID,
            Name: 'Admin User',
            TeamID: generalTeam.TeamID,
        },
    });

    const clerkUser = await prisma.user.upsert({
        where: { Email: 'clerk@123.com' },
        update: {},
        create: {
            Email: 'clerk@123.com',
            Password: 'clerk123',
            RoleID: clerkRole.RoleID,
            Name: 'Clerk User',
            TeamID: generalTeam.TeamID,
        },
    });

    // 4. Offices (InwardOutwardOffice)
    console.log('Seeding Offices...');
    const headOffice = await prisma.inwardOutwardOffice.upsert({
        where: { InwardOutwardOfficeID: 1 },
        update: {},
        create: {
            InwardOutwardOfficeID: 1,
            OfficeName: 'Main Head Office',
            InstituteID: 101,
            DepartmentID: 201,
            OpeningDate: new Date('2024-01-01'),
            OpeningInwardNo: 1,
            OpeningOutwardNo: 1,
            UserID: superAdmin.UserID,
            TeamID: generalTeam.TeamID,
            Remarks: 'Primary office for all major operations'
        }
    });

    const branchOffice = await prisma.inwardOutwardOffice.upsert({
        where: { InwardOutwardOfficeID: 2 },
        update: {},
        create: {
            InwardOutwardOfficeID: 2,
            OfficeName: 'City Branch Office',
            InstituteID: 102,
            DepartmentID: 202,
            OpeningDate: new Date('2024-01-01'),
            OpeningInwardNo: 1,
            OpeningOutwardNo: 1,
            UserID: superAdmin.UserID,
            TeamID: generalTeam.TeamID,
            Remarks: 'Secondary office located in city center'
        }
    });

    // 5. Modes (InOutwardMode)
    console.log('Seeding Modes...');
    const modes = ['Courier', 'Hand Delivery', 'Speed Post', 'Email', 'Registered Post'];
    const createdModes = [];
    for (const modeName of modes) {
        const mode = await prisma.inOutwardMode.upsert({
            where: { InOutwardModeID: modes.indexOf(modeName) + 1 },
            update: {},
            create: {
                InOutwardModeID: modes.indexOf(modeName) + 1,
                InOutwardModeName: modeName,
                IsActive: true,
                UserID: superAdmin.UserID,
                TeamID: generalTeam.TeamID,
            }
        });
        createdModes.push(mode);
    }

    // 6. From/To Contacts (InOutwardFromTo)
    console.log('Seeding Contacts...');
    const contacts = [
        { name: 'Ministry of Education', person: 'Dr. Rajesh Kumar', address: 'New Delhi, India', place: 'Delhi' },
        { name: 'National University', person: 'Prof. Anjali Sharma', address: 'Mumbai, Maharashtra', place: 'Mumbai' },
        { name: 'State Board of Tech Ed', person: 'Mr. Vivek Patel', address: 'Gandhinagar, Gujarat', place: 'Gandhinagar' }
    ];
    const createdContacts = [];
    for (const c of contacts) {
        const contact = await prisma.inOutwardFromTo.upsert({
            where: { InOutwardFromToID: contacts.indexOf(c) + 1 },
            update: {},
            create: {
                InOutwardFromToID: contacts.indexOf(c) + 1,
                InOutwardFromToName: c.name,
                PersonName: c.person,
                Address: c.address,
                Place: c.place,
                IsActive: true,
                UserID: superAdmin.UserID,
                TeamID: generalTeam.TeamID,
            }
        });
        createdContacts.push(contact);
    }

    // 7. Courier Companies
    console.log('Seeding Courier Companies...');
    const courierCompanies = [
        { name: 'BlueDart', contact: 'Customer Care', phone: '1860-233-1234', email: 'contact@bluedart.com' },
        { name: 'DTDC', contact: 'Suresh Raina', phone: '080-2678-8370', email: 'help@dtdc.com' }
    ];
    const createdCouriers = [];
    for (const cc of courierCompanies) {
        const courier = await prisma.courierCompany.upsert({
            where: { CourierCompanyID: courierCompanies.indexOf(cc) + 1 },
            update: {},
            create: {
                CourierCompanyID: courierCompanies.indexOf(cc) + 1,
                CourierCompanyName: cc.name,
                ContactPersonName: cc.contact,
                PhoneNo: cc.phone,
                Email: cc.email,
                UserID: superAdmin.UserID,
                TeamID: generalTeam.TeamID,
            }
        });
        createdCouriers.push(courier);
    }

    // 8. Inward Entries
    console.log('Seeding Inward Entries...');
    const inwardEntries = [
        {
            inwardNo: 'INW/2024/001',
            date: new Date('2024-04-10'),
            subject: 'Admission Policy Update',
            desc: 'New admission guidelines for the academic year 2024-25',
            modeIdx: 0, // Courier
            contactIdx: 0, // Ministry
            officeId: headOffice.InwardOutwardOfficeID
        },
        {
            inwardNo: 'INW/2024/002',
            date: new Date('2024-04-12'),
            subject: 'Examination Schedule',
            desc: 'Winter examination dates and venue details',
            modeIdx: 3, // Email
            contactIdx: 1, // National University
            officeId: branchOffice.InwardOutwardOfficeID
        }
    ];

    for (const entry of inwardEntries) {
        await prisma.inward.upsert({
            where: { InwardID: inwardEntries.indexOf(entry) + 1 },
            update: {},
            create: {
                InwardID: inwardEntries.indexOf(entry) + 1,
                InwardNo: entry.inwardNo,
                InwardDate: entry.date,
                Subject: entry.subject,
                SubjectShort: entry.subject.substring(0, 50),
                Description: entry.desc,
                InOutwardModeID: createdModes[entry.modeIdx].InOutwardModeID,
                InOutwardFromToID: createdContacts[entry.contactIdx].InOutwardFromToID,
                ToInwardOutwardOfficeID: entry.officeId,
                UserID: adminUser.UserID,
                TeamID: generalTeam.TeamID,
                FinYearID: 1, // Current Fin Year
                InwardLetterNo: `LET/${entry.date.getFullYear()}/${Math.floor(Math.random() * 1000)}`,
                InwardLetterDate: entry.date,
            }
        });
    }

    // 9. Outward Entries
    console.log('Seeding Outward Entries...');
    const outwardEntries = [
        {
            outwardNo: 'OUT/2024/001',
            date: new Date('2024-04-15'),
            subject: 'Response to Admission Policy',
            remarks: 'Compliance report sent for review',
            modeIdx: 2, // Speed Post
            contactIdx: 0, // Ministry
            officeId: headOffice.InwardOutwardOfficeID,
            replyToInwardId: 1
        },
        {
            outwardNo: 'OUT/2024/002',
            date: new Date('2024-04-16'),
            subject: 'Budget Request',
            remarks: 'Annual maintenance budget requirement',
            modeIdx: 1, // Hand Delivery
            contactIdx: 2, // State Board
            officeId: branchOffice.InwardOutwardOfficeID
        }
    ];

    for (const entry of outwardEntries) {
        await prisma.outward.upsert({
            where: { OutwardID: outwardEntries.indexOf(entry) + 1 },
            update: {},
            create: {
                OutwardID: outwardEntries.indexOf(entry) + 1,
                OutwardNo: entry.outwardNo,
                OutwardDate: entry.date,
                Subject: entry.subject,
                SubjectShort: entry.subject.substring(0, 50),
                Remarks: entry.remarks,
                InOutwardModeID: createdModes[entry.modeIdx].InOutwardModeID,
                InOutwardFromToID: createdContacts[entry.contactIdx].InOutwardFromToID,
                FromInwardOutwardOfficeID: entry.officeId,
                UserID: adminUser.UserID,
                TeamID: generalTeam.TeamID,
                FinYearID: 1,
                InwardID: entry.replyToInwardId || null,
                LetterNo: `OUT-LET/${entry.date.getFullYear()}/${Math.floor(Math.random() * 1000)}`,
                LetterDate: entry.date,
            }
        });
    }

    console.log('--- Seeding Completed Successfully ---');
}

main()
    .catch((e) => {
        console.error('Seed Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });

