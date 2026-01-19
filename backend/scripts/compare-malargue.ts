
import * as xlsx from 'xlsx';
import * as path from 'path';


const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData: any[] = xlsx.utils.sheet_to_json(sheet);

    const excelMalargue = excelData.filter(row => {
        const apt = (row['Ubicacion: Nombre '] || row['Sitio'] || '').toString().toLowerCase();
        return apt.includes('malargue') || apt.includes('malargüe');
    });

    const dbMalargue = await prisma.vhf.findFirst({
        where: {
            OR: [
                { aeropuerto: { contains: 'Malargue', mode: 'insensitive' } },
                { aeropuerto: { contains: 'Malargüe', mode: 'insensitive' } }
            ]
        },
        include: {
            equipos: {
                include: { frecuencias: true }
            }
        }
    });

    console.log(`\n📊 COMPARATIVA MALARGÜE (Excel vs DB)`);
    console.log(`--------------------------------------`);
    console.log(`Excel: ${excelMalargue.length} registros encontrados.`);
    console.log(`DB: ${dbMalargue?.equipos.length || 0} registros encontrados.`);

    console.log(`\n--- DETALLE EXCEL ---`);
    excelMalargue.forEach((r, i) => {
        console.log(`${i + 1}. [${r['Tipo']}] ${r['Marca']} ${r['Modelo']} | Freq: ${r['Frecuencia [MHz]']} | S/N: ${r['Nro de Serie']}`);
    });

    console.log(`\n--- DETALLE BASE DE DATOS ---`);
    dbMalargue?.equipos.forEach((e, i) => {
        const f = e.frecuencias?.[0]?.frecuencia || 'N/A';
        console.log(`${i + 1}. [${e.tipoEquipo}] ${e.marca} ${e.modelo} | Freq: ${f} | S/N: ${e.numeroSerie}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
