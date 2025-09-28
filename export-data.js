const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('Exporting data from SQLite...');
    
    // Export all data
    const users = await prisma.user.findMany({
      include: {
        tasks: {
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        },
        categories: true,
        accounts: true,
        sessions: true
      }
    });

    const verificationTokens = await prisma.verificationToken.findMany();

    const data = {
      users,
      verificationTokens,
      exportDate: new Date().toISOString()
    };

    // Write to file
    fs.writeFileSync('sqlite-export.json', JSON.stringify(data, null, 2));
    console.log('✅ Data exported successfully to sqlite-export.json');
    console.log(`📊 Exported ${users.length} users with their tasks and categories`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();