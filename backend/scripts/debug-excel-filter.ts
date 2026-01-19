
import * as xlsx from 'xlsx';
import * as path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');
    const workbook = xlsx.readFile(filePath);
    const data: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

    console.log('DEBUG: First 5 rows column values for location:');
    data.slice(0, 5).forEach(r => {
        console.log(`- Sitio: ${r['Sitio']}, Ubicacion: ${r['Ubicacion: Nombre ']}`);
    });

    const filtered = data.filter(r => {
        const s = (r['Sitio'] || '').toString().toLowerCase();
        const u = (r['Ubicacion: Nombre '] || '').toString().toLowerCase();
        return s.includes('malarg') || u.includes('malarg') || s.includes('mlg') || u.includes('mlg');
    });

    console.log('\nFOUND ROWS:', filtered.length);
    filtered.forEach(r => {
        console.log(`MATCH -> SITE: ${r['Sitio']}, NAME: ${r['Ubicacion: Nombre ']}, MARCA: ${r['Marca']}, MODELO: ${r['Modelo']}`);
    });
}
main();
