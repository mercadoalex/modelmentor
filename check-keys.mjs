import { readFileSync } from 'fs';
const en = JSON.parse(readFileSync('./src/i18n/locales/en.json', 'utf8'));
const es = JSON.parse(readFileSync('./src/i18n/locales/es.json', 'utf8'));

function getLeafKeys(obj, prefix) {
  prefix = prefix || '';
  let keys = [];
  for (const key of Object.keys(obj)) {
    const path = prefix ? prefix + '.' + key : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getLeafKeys(obj[key], path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

const enKeys = getLeafKeys(en).sort();
const esKeys = getLeafKeys(es).sort();

const missingInEs = enKeys.filter(k => !esKeys.includes(k));
const extraInEs = esKeys.filter(k => !enKeys.includes(k));

console.log('English keys: ' + enKeys.length);
console.log('Spanish keys: ' + esKeys.length);

if (missingInEs.length > 0) {
  console.log('Missing in es.json: ' + missingInEs.length);
  missingInEs.forEach(k => console.log('  - ' + k));
}
if (extraInEs.length > 0) {
  console.log('Extra in es.json: ' + extraInEs.length);
  extraInEs.forEach(k => console.log('  - ' + k));
}
if (missingInEs.length === 0 && extraInEs.length === 0) {
  console.log('Key parity OK: en.json and es.json have identical key structures');
}
