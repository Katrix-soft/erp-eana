
import * as xlsx from 'xlsx';
import * as path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');
    const workbook = xlsx.readFile(filePath);
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    const filtered = data.filter(r => {
        const s = (r['Sitio'] || '').toString().toLowerCase();
        const u = (r['Ubicacion: Nombre '] || '').toString().toLowerCase();
        return s.includes('malarg') || u.includes('malarg');
    });

    console.log('EXCEL DATA FOR MALARGÜE:');
    filtered.forEach((r, i) => {
        console.log(`${i + 1}. [${r['Tipo']}] ${r['Marca']} ${r['Modelo']} (S/N: ${r['Nro de Serie']})`);
    });
}
main();
