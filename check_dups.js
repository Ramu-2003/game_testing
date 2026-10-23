const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) results = results.concat(walk(full));
    else if (full.endsWith('.jsx')) results.push(full);
  });
  return results;
}

const files = walk('frontend/src');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/fontWeight:[^,}]+,[^}]*?fontWeight:[^,}]+/g);
  if (matches) {
    console.log('===', f);
    matches.forEach(m => console.log('  ', m));
  }
}
