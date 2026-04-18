
import fs from 'fs';

const content = fs.readFileSync('src/components/Production.tsx', 'utf8');
let depth = 0;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') depth++;
        if (char === '}') depth--;
        if (depth < 0) {
            console.log(`Negative depth at line ${i + 1}: ${line}`);
            process.exit(1);
        }
    }
}
console.log(`Final depth: ${depth}`);
