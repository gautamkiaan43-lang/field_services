import fs from 'fs';
import { parse } from '@babel/parser';

const filePath = 'c:/Users/syada/Desktop/kiaan tech/field service/frontend/src/pages/admin/JobDetails.jsx';
const content = fs.readFileSync(filePath, 'utf8');

try {
  parse(content, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('JSX parsing successful.');
} catch (e) {
  console.error('JSX parsing failed:');
  console.error(e.message);
  console.error('At line:', e.loc.line, 'col:', e.loc.column);
}
