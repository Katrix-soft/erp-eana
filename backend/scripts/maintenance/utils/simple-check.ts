
import * as xlsx from 'xlsx';
import * as path from 'path';


const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');
    const workbook = xlsx.readFile(filePath);
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const excelMalargue = data.filter(r => (r['Ubicacion: Nombre '] || r['Sitio'] || '').toString().toLowerCase().includes('malargue'));
    const dbVhf = await prisma.vhf.findFirst({ where: { aeropuerto: 'Malargüe' }, include: { equipos: true } });

    console.log('EXCEL COUNT:', excelMalargue.length);
    console.log('DB EQUIPOS COUNT:', dbVhf?.equipos.length);

    excelMalargue.forEach(r => {
        console.log(`EXCEL -> ${r['Marca']} ${r['Modelo']} S/N: ${r['Nro de Serie']}`);
    });

    dbVhf?.equipos.forEach(e => {
        console.log(`DB    -> ${e.marca} ${e.modelo} S/N: ${e.numeroSerie}`);
    });
}
main().finally(() => prisma.$disconnect());
