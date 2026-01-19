

import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { role: 'CNS_NACIONAL' },
                    { personal: { is: null } },
                ],
            },
            include: {
                personal: {
                    include: {
                        puesto: true,
                    },
                },
            },
        });

        let output = 'Usuarios encontrados (CNS_NACIONAL o sin puesto definido):\n';
        output += '-------------------------------------------------------\n';

        if (users.length === 0) {
            output += 'No se encontraron usuarios que coincidan con los criterios.\n';
        }

        for (const user of users) {
            const position = user.personal?.puesto?.nombre || 'SIN PUESTO';
            output += `ID: ${user.id}\n`;
            output += `Email: ${user.email}\n`;
            output += `Rol: ${user.role}\n`;
            output += `Puesto: ${position}\n`;
            output += '---\n';
        }

        fs.writeFileSync(path.join(__dirname, 'users_report.txt'), output);
        console.log('Reporte generado en users_report.txt');

    } catch (error) {
        console.error('Error al buscar usuarios:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
