import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';

const execAsync = promisify(exec);

async function createMigration() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(query, resolve);
    });
  };

  try {
    const migrationName = await question('Enter migration name: ');

    if (!migrationName || migrationName.trim() === '') {
      console.error('Migration name is required');
      process.exit(1);
    }

    const { stdout, stderr } = await execAsync(
      `npx migrate-mongo create ${migrationName.trim()}`
    );

    if (stderr) {
      console.error('Error:', stderr);
    }

    console.log(stdout);
    console.log('\nMigration created successfully!');
    console.log('\nNext steps:');
    console.log('1. Edit the migration file in backend/migrations/migrations/');
    console.log('2. Import schemas from @demo-viewer/database if needed');
    console.log('3. Run migrations with: pnpm migrate:up');
  } catch (error) {
    console.error('Failed to create migration:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

createMigration();
