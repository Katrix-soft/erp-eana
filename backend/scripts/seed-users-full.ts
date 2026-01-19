
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const csvPath = path.join(__dirname, '../CREDENCIALES_VALIDAS.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split('\n').slice(1); // Skip header

    console.log(`Starting to seed ${lines.length} users...`);

    const sectors = ['CNSE', 'COMUNICACIONES', 'NAVEGACION', 'VIGILANCIA', 'ENERGIA'];

    for (const line of lines) {
        if (!line.trim()) continue;

        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (parts.length < 9) continue;

        let [usuario, email, password, nombre, apellido, rol, sector, puestoNombre, aeroCodigo] = parts;

        nombre = nombre.replace(/"/g, '').trim();
        apellido = apellido.replace(/"/g, '').trim();
        puestoNombre = puestoNombre.replace(/"/g, '').trim();
        sector = sector.trim().toUpperCase();

        if (!sectors.includes(sector)) {
            sector = 'CNSE';
        }

        const hashedPassword = await bcrypt.hash(password.trim() || 'Eana2025', 10);

        try {
            // 1. Get or create Puesto
            const puesto = await prisma.puestoPersonal.upsert({
                where: { nombre_sector: { nombre: puestoNombre, sector: sector as any } },
                update: {},
                create: {
                    nombre: puestoNombre,
                    sector: sector as any
                }
            });

            // 2. Get Aeropuerto (if exists)
            const aero = aeroCodigo.trim() !== 'N/A' ? await prisma.aeropuerto.findFirst({
                where: { OR: [{ codigo: aeroCodigo.trim() }, { nombre: aeroCodigo.trim() }] }
            }) : null;

            // 3. Create User
            const user = await prisma.user.upsert({
                where: { email: email.trim().toLowerCase() },
                update: {
                    role: rol.trim() as any,
                },
                create: {
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                    role: rol.trim() as any,
                    passwordChanged: false
                }
            });

            // 4. Create Personal
            await prisma.personal.upsert({
                where: { userId: user.id },
                update: {
                    nombre: nombre,
                    apellido: apellido,
                    sector: sector as any,
                    puestoId: puesto.id,
                    aeropuertoId: aero?.id || null
                },
                create: {
                    nombre: nombre,
                    apellido: apellido,
                    sector: sector as any,
                    userId: user.id,
                    puestoId: puesto.id,
                    aeropuertoId: aero?.id || null
                }
            });

        } catch (err) {
            console.error(`Error seeding user ${email}:`, err.message);
        }
    }

    console.log('Users and Personal seeded successfully!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
