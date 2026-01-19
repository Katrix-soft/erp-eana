
import * as xlsx from 'xlsx';
import * as path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    const malargueRows = data.filter(row => {
        const apt = (row['Ubicacion: Nombre '] || row['Sitio'] || '').toString().toLowerCase();
        return apt.includes('malargue') || apt.includes('malargüe') || apt.includes('mlg');
    });

    console.log(`=== EXCEL: MALARGÜE ===`);
    malargueRows.forEach((row, i) => {
        console.log(`${i + 1}. [${row['Tipo']}] ${row['Marca']} ${row['Modelo']} | Freq: ${row['Frecuencia [MHz]']} | S/N: ${row['Nro de Serie']}`);
    });
}

main().catch(console.error);
