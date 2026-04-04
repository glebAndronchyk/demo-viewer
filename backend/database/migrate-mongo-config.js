require('dotenv').config({ path: '../../.env' });

const config = {
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    databaseName: process.env.MONGODB_DATABASE || 'demo-viewer',
    options: {}
  },
  migrationsDir: './migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
