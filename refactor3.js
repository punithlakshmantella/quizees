const fs = require('fs');
let s = fs.readFileSync('script.js', 'utf8');

// Replace the remaining /api/questions fetch
s = s.replace(/const response = await fetch\('\/api\/questions', \{[\s\S]*?const data = await response\.json\(\);/g, `
    // Bypassed fetch
`);

// Replace /api/topics
s = s.replace(/const response = await fetch\('\/api\/topics'\);[\s\S]*?const data = await response\.json\(\);/g, `
    // Bypassed fetch
    const data = {};
`);

// Replace delete topic fetch
s = s.replace(/const response = await fetch\(\`\/api\/topics\/\$\{topicVal\}\`, \{[\s\S]*?\}\);/g, `
    const response = { ok: true };
`);

fs.writeFileSync('script.js', s);
console.log('Final fetch cleanup complete.');
