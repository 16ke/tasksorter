const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importData() {
  try {
    console.log('Importing data to Neon PostgreSQL...');
    
    // Read exported data
    const data = JSON.parse(fs.readFileSync('sqlite-export.json', 'utf8'));
    console.log(`📊 Found ${data.users.length} users to import`);

    // Import users and their related data
    for (const user of data.users) {
      console.log(`Importing user: ${user.email}`);
      
      // Create user
      const newUser = await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
          hashedPassword: user.hashedPassword,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });

      // Import categories
      for (const category of user.categories) {
        await prisma.category.create({
          data: {
            id: category.id,
            name: category.name,
            color: category.color,
            userId: newUser.id,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
          }
        });
      }

      // Import tasks with categories
      for (const task of user.tasks) {
        const newTask = await prisma.task.create({
          data: {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate,
            userId: newUser.id,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }
        });

        // Link tasks to categories
        for (const taskCategory of task.categories) {
          await prisma.taskCategory.create({
            data: {
              id: taskCategory.id,
              taskId: newTask.id,
              categoryId: taskCategory.category.id,
              createdAt: taskCategory.createdAt
            }
          });
        }
      }

      // Import accounts and sessions if they exist
      if (user.accounts && user.accounts.length > 0) {
        for (const account of user.accounts) {
          await prisma.account.create({
            data: {
              ...account,
              userId: newUser.id
            }
          });
        }
      }

      if (user.sessions && user.sessions.length > 0) {
        for (const session of user.sessions) {
          await prisma.session.create({
            data: {
              ...session,
              userId: newUser.id
            }
          });
        }
      }
    }

    // Import verification tokens
    if (data.verificationTokens && data.verificationTokens.length > 0) {
      for (const token of data.verificationTokens) {
        await prisma.verificationToken.create({
          data: token
        });
      }
    }

    console.log('✅ Data imported successfully to Neon PostgreSQL!');
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();