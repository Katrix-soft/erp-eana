
import { PrismaClient, Sector, Role } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

// Helper to remove dots from DNI
const cleanDni = (dni: string) => dni ? dni.replace(/\./g, '').trim() : null;

// Helper to determine Sector
const getSector = (departamento: string, cargo: string): Sector => {
    const dept = departamento?.toLowerCase() || '';
    const car = cargo?.toLowerCase() || '';

    if (dept.includes('vigilancia') || car.includes('vigilancia')) return 'VIGILANCIA';
    if (dept.includes('navegación') || dept.includes('navegacion') || car.includes('navegación')) return 'NAVEGACION';
    if (dept.includes('comunicaciones') || car.includes('comunicaciones')) return 'COMUNICACIONES';
    if (dept.includes('energía') || dept.includes('energia') || car.includes('energía')) return 'ENERGIA';

    return 'CNSE'; // Default
};

// Helper to determine Role
const getRole = (cargo: string): Role => {
    const car = cargo?.toLowerCase() || '';
    if (car.includes('jefe') || car.includes('coordinador')) return 'JEFE_COORDINADOR';
    if (car.includes('nacional') || car.includes('gerente')) return 'CNS_NACIONAL';
    if (car.includes('admin')) return 'ADMIN';
    return 'TECNICO';
};

// Helper to clean Puesto name
const cleanPuesto = (cargo: string): string => {
    // Simplify cargo names to generic categories if needed, or keep full
    // For now let's try to map to generic if possible, or create specific
    const car = cargo?.trim();
    if (!car) return 'Técnico';

    // Normalize basic roles
    if (car.startsWith('Técnico')) return 'Técnico';
    if (car.startsWith('Coordinador')) return 'Coordinador';
    if (car.startsWith('Jefe')) return 'Jefe';
    if (car.startsWith('Analista')) return 'Analista';
    if (car.startsWith('Ingeniero')) return 'Ingeniero';
    if (car.startsWith('Asistente')) return 'Administrativo';

    return car;
};

async function main() {
    const csvPath = path.join(__dirname, '../../Personal CNSE Nacional.csv');
    console.log(`📖 Leyendo archivo: ${csvPath}`);

    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        bom: true,
        trim: true
    });

    console.log(`📊 Procesando ${records.length} registros...`);

    const hashedPassword = await bcrypt.hash('Eana2024!', 10);
    let count = 0;
    let errors = 0;

    // Cache existing data to avoid frequent DB lookups
    const aeropuertos = await prisma.aeropuerto.findMany();
    const firs = await prisma.fir.findMany();
    const puestosDB = await prisma.puestoPersonal.findMany();

    // Create a map for quick access
    const aeropuertoMap = new Map();
    aeropuertos.forEach(a => {
        aeropuertoMap.set(a.codigo?.toUpperCase(), a.id);
        aeropuertoMap.set(a.nombre?.toUpperCase(), a.id);
        // Also map "Sitio" format if needed
    });

    const firMap = new Map();
    firs.forEach(f => {
        firMap.set(f.nombre?.toUpperCase(), f.id);
        // Handle "FIR EZE" format normalization
        const shortName = f.nombre.replace('FIR ', '').trim().toUpperCase();
        firMap.set(shortName, f.id);
    });

    for (const record of records) {
        try {
            // Extract fields
            const nombre = record['Nombres']?.trim() || record['Nombre']?.trim()?.split(' ')[0];
            const apellido = record['Apellidos']?.trim() || record['Nombre']?.trim()?.split(' ').slice(1).join(' ');
            const email = record['Correo EANA']?.trim()?.toLowerCase();
            const dni = cleanDni(record['DNI']);
            const cargo = record['Cargo']?.trim();
            const departamento = record['Departamento']?.trim();
            const sitio = record['Sitio']?.trim();     // Name like "Aeroparque"
            const firRecord = record['FIR']?.trim();   // "FIR EZE"
            const code = record['ID_AP_SIG']?.trim();  // "EZE"

            if (!email) {
                console.log(`⚠️ Salteando registro sin email: ${nombre} ${apellido}`);
                continue;
            }

            // 1. Determine Puesto
            const puestoNombre = cleanPuesto(cargo);
            let puestoId: number;

            const existingPuesto = puestosDB.find(p => p.nombre.toLowerCase() === puestoNombre.toLowerCase());
            if (existingPuesto) {
                puestoId = existingPuesto.id;
            } else {
                // Upsert safe check
                const p = await prisma.puestoPersonal.upsert({
                    where: { nombre_sector: { nombre: puestoNombre, sector: 'CNSE' } }, // Using CNSE as generic sector for Puesto definition if specific combination not found
                    update: {},
                    create: { nombre: puestoNombre, sector: 'CNSE' }
                });
                puestoId = p.id;
                puestosDB.push(p); // update cache
            }

            // 2. Determine Location (Aeropuerto vs FIR)
            let aeropuertoId: number | null = null;
            let firId: number | null = null;

            // Try matching Aeropuerto by Code first
            if (code && aeropuertoMap.has(code.toUpperCase())) {
                aeropuertoId = aeropuertoMap.get(code.toUpperCase());
            }
            // Then by Sitio Name
            else if (sitio && aeropuertoMap.has(sitio.toUpperCase())) {
                aeropuertoId = aeropuertoMap.get(sitio.toUpperCase());
            }

            // If no Airport, check FIR
            if (!aeropuertoId) {
                // e.g. "FIR EZE" -> FIR EZE
                const normalizedFir = firRecord?.toUpperCase();
                if (normalizedFir) {
                    // Check exact match
                    if (firMap.has(normalizedFir)) {
                        firId = firMap.get(normalizedFir);
                    }
                    // Check "FIR " + ...
                    else if (firMap.has('FIR ' + normalizedFir)) {
                        firId = firMap.get('FIR ' + normalizedFir);
                    }
                    // Check if it's just the suffix (e.g. "EZE")
                    else if (firMap.has(normalizedFir.replace('FIR ', '').trim())) {
                        firId = firMap.get(normalizedFir.replace('FIR ', '').trim());
                    }
                }
            }

            // Fallback for DSER / CECODI / Laboratorio / CMR -> Usually mapped to a specific base or just null (Nacional)
            // But schema allows nulls.

            // 3. Info Personal
            const sector = getSector(departamento, cargo);
            const userRole = getRole(cargo);

            // 4. Create/Update Logic
            // We need to link User -> Personal.
            // First create User if not exists.

            const userParams = {
                email: email,
                password: hashedPassword,
                role: userRole,
            };

            const personalParams = {
                nombre: nombre || 'Unknown',
                apellido: apellido || 'Unknown',
                dni: dni,
                puestoId: puestoId,
                aeropuertoId: aeropuertoId,
                firId: firId,
                sector: sector
            };

            // Using upsert on User
            const user = await prisma.user.upsert({
                where: { email: email },
                update: {
                    role: userRole,
                    // Optionally update password if requested, but better leave it if exists? 
                    // User requested "TODOS tiene que tener password Eana2024!", so yes update it.
                    password: hashedPassword
                },
                create: {
                    ...userParams
                }
            });

            // Handle Personal
            // Find existing personal by DNI if available, or by userId
            let personal = await prisma.personal.findFirst({
                where: {
                    OR: [
                        { dni: dni },
                        { userId: user.id }
                    ]
                }
            });

            if (personal) {
                // Update
                await prisma.personal.update({
                    where: { id: personal.id },
                    data: {
                        ...personalParams,
                        userId: user.id
                    }
                });
            } else {
                // Create
                await prisma.personal.create({
                    data: {
                        ...personalParams,
                        userId: user.id
                    }
                });
            }

            count++;
            if (count % 50 === 0) console.log(`   Processed ${count} records...`);

        } catch (error) {
            console.error(`❌ Error procesando registro ${record['Correo EANA']}:`, error.message);
            errors++;
        }
    }

    console.log(`\n✅ Proceso Finalizado.`);
    console.log(`   Procesados: ${count}`);
    console.log(`   Errores: ${errors}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
