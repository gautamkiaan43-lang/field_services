const fs = require('fs');
const content = fs.readFileSync('c:/Users/syada/Desktop/kiaan tech/field service/frontend/src/pages/admin/JobDetails.jsx', 'utf8');

let braceBalance = 0;
let parenBalance = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    for (let char of lines[i]) {
        if (char === '{') braceBalance++;
        if (char === '}') braceBalance--;
        if (char === '(') parenBalance++;
        if (char === ')') parenBalance--;
    }
    if (braceBalance < 0) console.error('Negative brace balance at line', i + 1);
    if (parenBalance < 0) console.error('Negative paren balance at line', i + 1);
}

console.log('Final brace balance:', braceBalance);
console.log('Final paren balance:', parenBalance);
