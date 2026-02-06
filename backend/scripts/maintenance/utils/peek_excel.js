const XLSX = require('./node_modules/xlsx/xlsx.js');
const fs = require('fs');
try {
    const workbook = XLSX.readFile('..\\Instrumental NAV.xlsx');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const result = {
        headers: headers,
        sample: data[0]
    };
    fs.writeFileSync('excel_dump.json', JSON.stringify(result, null, 2));
    console.log('Dumped to excel_dump.json');
} catch (e) {
    console.error('Error:', e.message);
}
