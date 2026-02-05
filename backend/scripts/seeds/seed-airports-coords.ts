import { DataSource } from 'typeorm';
import { Aeropuerto } from '../src/aeropuertos/entities/aeropuerto.entity';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '..', '.env') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: parseInt(process.env.POSTGRES_PORT || '5434'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgrespassword',
    database: process.env.POSTGRES_DB || 'cns_db',
    entities: [Aeropuerto],
    synchronize: false,
});

const airportsData = [
    { codigo: 'EZE', latitud: -34.8222, longitud: -58.5358 }, // Ezeiza
    { codigo: 'AEP', latitud: -34.5592, longitud: -58.4156 }, // Aeroparque
    { codigo: 'COR', latitud: -31.3236, longitud: -64.208 },  // Córdoba
    { codigo: 'DOZ', latitud: -32.8317, longitud: -68.7929 }, // Mendoza
    { codigo: 'BAR', latitud: -41.1511, longitud: -71.1577 }, // Bariloche
    { codigo: 'SAL', latitud: -24.856, longitud: -65.4861 },  // Salta
    { codigo: 'ROS', latitud: -32.9036, longitud: -60.7844 }, // Rosario
    { codigo: 'NQN', latitud: -38.9489, longitud: -68.1558 }, // Neuquén
    { codigo: 'USU', latitud: -54.8433, longitud: -68.2958 }, // Ushuaia
    { codigo: 'MDZ', latitud: -32.8317, longitud: -68.7929 }, // Mendoza (Alternative code)
];

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Connected to DB');

        const repo = AppDataSource.getRepository(Aeropuerto);

        for (const data of airportsData) {
            const airport = await repo.findOne({
                where: [
                    { codigo: data.codigo },
                    { nombre: data.codigo }
                ]
            });

            if (airport) {
                airport.latitud = data.latitud;
                airport.longitud = data.longitud;
                await repo.save(airport);
                console.log(`Updated ${data.codigo}`);
            } else {
                console.log(`Airport ${data.codigo} not found`);
            }
        }

        console.log('Seeding finished');
        await AppDataSource.destroy();
    } catch (err) {
        console.error('Error during seeding:', err);
    }
}

seed();
