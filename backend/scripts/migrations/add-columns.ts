import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Agregando columnas frecuencia y canal...\n');

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS frecuencia DOUBLE PRECISION;`);
        console.log('✅ Columna frecuencia agregada');
    } catch (error: any) {
        console.log('⚠️  Columna frecuencia:', error.message);
    }

    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE comunicaciones ADD COLUMN IF NOT EXISTS canal VARCHAR(255);`);
        console.log('✅ Columna canal agregada\n');
    } catch (error: any) {
        console.log('⚠️  Columna canal:', error.message);
    }

    console.log('✅ Proceso completado');
}

main()
    .catch((e) => {
        console.error('❌ Error fatal:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
