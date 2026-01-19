
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(__dirname, '../../aeropuertos_limpios.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header

    for (const line of lines) {
        if (!line.trim()) continue;
        const [nombre, codigo, firNombre] = line.split(',');

        if (!nombre || !codigo || !firNombre) continue;

        const fir = await prisma.fir.upsert({
            where: { nombre: firNombre.trim() },
            update: {},
            create: { nombre: firNombre.trim() }
        });

        await prisma.aeropuerto.upsert({
            where: { codigo: codigo.trim() },
            update: { nombre: nombre.trim(), firId: fir.id },
            create: { nombre: nombre.trim(), codigo: codigo.trim(), firId: fir.id }
        });
    }

    console.log('Aeropuertos and FIRs seeded!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
