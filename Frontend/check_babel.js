const fs = require('fs');
const babel = require('@babel/parser');

try {
  const content = fs.readFileSync('src/pages/admin/JobDetails.jsx', 'utf8');
  babel.parse(content, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('No syntax errors found by Babel.');
} catch (err) {
  console.error(`Syntax error: ${err.message}`);
}
