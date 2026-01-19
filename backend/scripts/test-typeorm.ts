
import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5434,
    username: "postgres",
    password: "postgrespassword",
    database: "cns_db",
    synchronize: false,
    logging: true,
    entities: [],
    subscribers: [],
    migrations: [],
})

AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized!")
        process.exit(0)
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
        process.exit(1)
    })
