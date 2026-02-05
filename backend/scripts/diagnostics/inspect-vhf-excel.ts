
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), '../Equipamiento VHF Nacional.xlsx');

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Obtener datos como JSON array
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log('Total filas:', data.length);
    if (data.length > 0) {
        console.log('Cabeceras/Keys de la primera fila:', Object.keys(data[0]));
        console.log('Ejemplo fila 1:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('El archivo parece estar vacío.');
    }

} catch (error) {
    console.error('Error leyendo archivo:', error);
}
