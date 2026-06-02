const fs = require('fs');
const path = require('path');

try {
    const filePath = 'c:/Users/syada/Desktop/kiaan tech/field service/frontend/src/pages/admin/JobDetails.jsx';
    const content = fs.readFileSync(filePath, 'utf8');
    
    let line = 1;
    let col = 1;
    let balance = 0;
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '\n') {
            line++;
            col = 1;
        } else {
            col++;
        }
        
        if (char === '{') balance++;
        if (char === '}') balance--;
        
        if (balance < 0) {
            console.error(`Unbalanced closing brace at line ${line}, col ${col}`);
            process.exit(1);
        }
    }
    
    if (balance > 0) {
        console.error(`Unbalanced opening brace: ${balance} braces still open at end of file`);
        process.exit(1);
    }
    
    console.log('Braces are balanced.');
} catch (e) {
    console.error(e);
}
