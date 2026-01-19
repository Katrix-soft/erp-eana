import * as XLSX from 'xlsx';
import * as path from 'path';

const excelPath = path.join(__dirname, '../../Equipamiento VHF Nacional.xlsx');
const workbook = XLSX.readFile(excelPath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

console.log(JSON.stringify(data.slice(0, 10), null, 2));
