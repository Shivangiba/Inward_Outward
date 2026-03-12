// Diagnostic script to check TeamID values for Admin and Clerk users
// Run this with: npx ts-node scripts/check-admin-clerk-teams.ts

import { prisma } from '../lib/prisma.js';

async function main() {

  // Get RoleIDs for ADMIN and CLERK
  const roles = await prisma.role.findMany({
    where: { RoleName: { in: ['ADMIN', 'CLERK'] } },
    select: { RoleID: true, RoleName: true }
  });
  const roleIds = roles.map(r => r.RoleID);

  const users = await prisma.user.findMany({
    where: {
      RoleID: { in: roleIds },
    },
    select: {
      UserID: true,
      Email: true,
      RoleID: true,
      TeamID: true,
      Name: true,
      IsActive: true,
    },
  });

  if (users.length === 0) {
    console.log('No Admin or Clerk users found.');
    return;
  }

  // Map RoleID to RoleName for display
  const roleMap = Object.fromEntries(roles.map(r => [r.RoleID, r.RoleName]));

  console.log('Admin/Clerk users and their TeamIDs:');
  users.forEach((u) => {
    console.log(`UserID: ${u.UserID}, Email: ${u.Email}, Name: ${u.Name}, Role: ${roleMap[u.RoleID]}, TeamID: ${u.TeamID}, Active: ${u.IsActive}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
