
const fs = require('fs');

const content = fs.readFileSync('src/components/Production.tsx', 'utf8');
const lines = content.split('\n');

let braceDepth = 0;
let divDepth = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check braces
    for (const char of line) {
        if (char === '{') braceDepth++;
        if (char === '}') braceDepth--;
        if (braceDepth < 0) {
            console.log(`EXTRA CLOSING BRACE at line ${i + 1}: ${line.trim()}`);
            braceDepth = 0; // Reset for continue? Or maybe just stop.
        }
    }

    // Check divs (naive)
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    divDepth += openDivs;
    divDepth -= closeDivs;
    
    if (divDepth < 0) {
        console.log(`EXTRA CLOSING DIV at line ${i + 1}: ${line.trim()}`);
        divDepth = 0;
    }
}

console.log(`Final Brace Depth: ${braceDepth}`);
console.log(`Final Div Depth: ${divDepth}`);
