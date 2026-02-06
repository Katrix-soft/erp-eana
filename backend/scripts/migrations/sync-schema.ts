
import { DataSource } from "typeorm"
import * as path from 'path';
import * as fs from 'fs';
require('dotenv').config();

// Detect if we're in production (compiled) or development
const isProd = __filename.endsWith('.js');

// In production, entities are in dist/src/**/*.entity.js
// In development, entities are in src/**/*.entity.ts
let entitiesPath: string;

if (isProd) {
    // Production: we're in dist/scripts/migrations/sync-schema.js
    // Entities are in dist/src/**/*.entity.js
    entitiesPath = path.join(__dirname, '../../src/**/*.entity.js');
} else {
    // Development: we're in scripts/migrations/sync-schema.ts
    // Entities are in src/**/*.entity.ts
    entitiesPath = path.join(__dirname, '../../../src/**/*.entity.ts');
}

console.log(`🔍 Looking for entities in: ${entitiesPath}`);
console.log(`📁 Current directory: ${__dirname}`);
console.log(`🏗️  Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
    database: process.env.POSTGRES_DB || 'cns_db',
    synchronize: true,
    logging: true,
    entities: [entitiesPath],
})

AppDataSource.initialize()
    .then(async () => {
        console.log("✅ Database connection established!");
        console.log(`📊 Found ${AppDataSource.entityMetadatas.length} entities`);

        // List all entities found
        console.log("📋 Entities:");
        AppDataSource.entityMetadatas.forEach(entity => {
            console.log(`   - ${entity.tableName}`);
        });

        console.log("🚀 Database schema synchronized!");
        await AppDataSource.destroy();
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Error during synchronization:", err);
        process.exit(1);
    })
