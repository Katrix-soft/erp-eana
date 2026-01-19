import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Aplicando migración manual...\n');

    const sql = fs.readFileSync(path.join(__dirname, '..', 'add-frequency-canal.sql'), 'utf-8');

    await prisma.$executeRawUnsafe(sql);

    console.log('✅ Migración aplicada exitosamente\n');
}

main()
    .catch(e => console.error('❌ Error:', e))
    .finally(() => prisma.$disconnect());
