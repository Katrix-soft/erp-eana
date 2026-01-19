const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Equipamiento VHF Nacional.xlsx');
const wb = XLSX.readFile(filePath);

console.log('📊 Sheets:', wb.SheetNames);

const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

console.log('📈 Total rows:', data.length);
console.log('📋 Columns:', Object.keys(data[0] || {}));
console.log('\n🔍 First 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));
