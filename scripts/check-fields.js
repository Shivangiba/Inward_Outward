const { Prisma } = require('@prisma/client');

console.log('Inward fields:', Object.keys(Prisma.InwardScalarFieldEnum));
console.log('Office fields:', Object.keys(Prisma.InwardOutwardOfficeScalarFieldEnum));
console.log('Courier fields:', Object.keys(Prisma.CourierCompanyScalarFieldEnum));
