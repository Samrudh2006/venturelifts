import { prisma } from './lib/database.mjs';

const users = await prisma.user.findMany();
console.log("Users:", users.length);

const ventures = await prisma.venture.findMany();
console.log("Ventures:", ventures.length);

const reports = await prisma.aiReport.findMany();
console.log("Reports:", reports.length);

await prisma.$disconnect();