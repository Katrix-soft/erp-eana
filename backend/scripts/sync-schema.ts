
import { DataSource } from "typeorm"
import * as path from 'path';

// Import all entities
// Note: We'll use the glob pattern which works in DataSource constructor for Node
const entitiesPath = path.join(__dirname, '..', 'src', '**', '*.entity.ts');

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5434,
    username: "postgres",
    password: "postgrespassword",
    database: "cns_db",
    synchronize: true, // This is what we want!
    logging: true,
    entities: [entitiesPath],
})

AppDataSource.initialize()
    .then(() => {
        console.log("🚀 Database schema synchronized!");
        process.exit(0)
    })
    .catch((err) => {
        console.error("❌ Error during synchronization:", err)
        process.exit(1)
    })
