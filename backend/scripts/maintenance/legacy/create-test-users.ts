
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const password = 'Eana2024!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('🔧 Creando usuarios de prueba...\n');

    // 1. Get FIRs
    const firs = await prisma.fir.findMany({ take: 3 });
    if (firs.length === 0) {
        console.log('❌ No hay FIRs en la base de datos');
        return;
    }

    // 2. Get Aeropuertos
    const aeropuertos = await prisma.aeropuerto.findMany({ take: 5, include: { fir: true } });
    if (aeropuertos.length === 0) {
        console.log('❌ No hay Aeropuertos en la base de datos');
        return;
    }

    // 3. Get Puestos
    const puestos = await prisma.puestoPersonal.findMany({ take: 5 });
    if (puestos.length === 0) {
        console.log('❌ No hay Puestos en la base de datos');
        return;
    }

    const testUsers = [
        {
            email: 'tecnico.fir@eana.com.ar',
            role: 'TECNICO',
            personal: {
                nombre: 'Juan',
                apellido: 'Pérez',
                dni: '12345678',
                sector: 'CNSE',
                puestoId: puestos[0].id,
                firId: firs[0].id,
                aeropuertoId: null
            },
            description: 'Técnico asignado solo a FIR (sin aeropuerto)'
        },
        {
            email: 'tecnico.aeropuerto@eana.com.ar',
            role: 'TECNICO',
            personal: {
                nombre: 'María',
                apellido: 'González',
                dni: '23456789',
                sector: 'COMUNICACIONES',
                puestoId: puestos[1]?.id || puestos[0].id,
                firId: null,
                aeropuertoId: aeropuertos[0].id
            },
            description: 'Técnico asignado a Aeropuerto (FIR heredado)'
        },
        {
            email: 'coordinador.aeropuerto@eana.com.ar',
            role: 'JEFE_COORDINADOR',
            personal: {
                nombre: 'Carlos',
                apellido: 'Rodríguez',
                dni: '34567890',
                sector: 'NAVEGACION',
                puestoId: puestos[2]?.id || puestos[0].id,
                firId: null,
                aeropuertoId: aeropuertos[1]?.id || aeropuertos[0].id
            },
            description: 'Coordinador asignado a Aeropuerto'
        },
        {
            email: 'cns.nacional@eana.com.ar',
            role: 'CNS_NACIONAL',
            personal: {
                nombre: 'Ana',
                apellido: 'Martínez',
                dni: '45678901',
                sector: 'CNSE',
                puestoId: puestos[3]?.id || puestos[0].id,
                firId: firs[1]?.id || firs[0].id,
                aeropuertoId: null
            },
            description: 'CNS Nacional asignado a FIR'
        },
        {
            email: 'admin.test@eana.com.ar',
            role: 'ADMIN',
            personal: null,
            description: 'Admin sin datos de personal'
        }
    ];

    const results = [];

    for (const testUser of testUsers) {
        try {
            // Check if user exists
            const existing = await prisma.user.findUnique({
                where: { email: testUser.email }
            });

            let user;
            if (existing) {
                // Update password
                user = await prisma.user.update({
                    where: { email: testUser.email },
                    data: { password: hashedPassword },
                    include: {
                        personal: {
                            include: {
                                aeropuerto: { include: { fir: true } },
                                fir: true,
                                puesto: true
                            }
                        }
                    }
                });
                console.log(`✅ Usuario actualizado: ${testUser.email}`);
            } else {
                // Create user
                user = await prisma.user.create({
                    data: {
                        email: testUser.email,
                        password: hashedPassword,
                        role: testUser.role as 'TECNICO' | 'JEFE_COORDINADOR' | 'CNS_NACIONAL' | 'ADMIN',
                        personal: testUser.personal ? {
                            create: testUser.personal as any
                        } : undefined
                    },
                    include: {
                        personal: {
                            include: {
                                aeropuerto: { include: { fir: true } },
                                fir: true,
                                puesto: true
                            }
                        }
                    }
                });
                console.log(`✅ Usuario creado: ${testUser.email}`);
            }

            results.push({
                email: testUser.email,
                password: password,
                role: testUser.role,
                description: testUser.description,
                personal: user.personal ? {
                    nombre: user.personal.nombre,
                    apellido: user.personal.apellido,
                    sector: user.personal.sector,
                    puesto: user.personal.puesto?.nombre,
                    aeropuerto: user.personal.aeropuerto?.nombre,
                    firDirecto: user.personal.fir?.nombre,
                    firHeredado: user.personal.aeropuerto?.fir?.nombre
                } : null
            });

        } catch (error) {
            console.error(`❌ Error con ${testUser.email}:`, error.message);
        }
    }

    console.log('\n📊 RESUMEN DE USUARIOS DE PRUEBA:\n');
    console.log('='.repeat(80));

    results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.description}`);
        console.log(`   Email: ${result.email}`);
        console.log(`   Password: ${result.password}`);
        console.log(`   Role: ${result.role}`);

        if (result.personal) {
            console.log(`   Personal:`);
            console.log(`     - Nombre: ${result.personal.nombre} ${result.personal.apellido}`);
            console.log(`     - Sector: ${result.personal.sector}`);
            console.log(`     - Puesto: ${result.personal.puesto || 'N/A'}`);
            console.log(`     - Aeropuerto: ${result.personal.aeropuerto || 'N/A'}`);
            console.log(`     - FIR Directo: ${result.personal.firDirecto || 'N/A'}`);
            console.log(`     - FIR Heredado: ${result.personal.firHeredado || 'N/A'}`);
            console.log(`     - FIR Final: ${result.personal.firDirecto || result.personal.firHeredado || 'N/A'}`);
        }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Usuarios de prueba creados exitosamente!');
    console.log('📝 Password para todos: Eana2024!\n');

    return results;
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
