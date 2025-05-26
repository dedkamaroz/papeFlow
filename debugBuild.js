const fs = require('fs');
const path = require('path');

console.log('🔍 Checking build output...\n');

const checks = [
{
    path: 'dist/main/index.js',
    required: true,
    description: 'Main process bundle'
},
{
    path: 'dist/main/preload.js',
    required: true,
    description: 'Preload script'
},
{
    path: 'dist/renderer/index.html',
    required: true,
    description: 'Renderer HTML file'
},
{
    path: 'dist/renderer',
    required: true,
    description: 'Renderer directory',
    checkContents: true
}
];

let allGood = true;

checks.forEach(check => {
const fullPath = path.join(__dirname, check.path);
const exists = fs.existsSync(fullPath);

console.log(`${exists ? '✅' : '❌'} ${check.description}`);
console.log(`   Path: ${fullPath}`);

if (exists && check.checkContents) {
const contents = fs.readdirSync(fullPath);
console.log(`   Contents: ${contents.join(', ')}`);
}

if (!exists && check.required) {
allGood = false;
}

console.log('');
});

if (!allGood) {
console.log('❌ Some required files are missing. Please run:');
console.log('   npm run build');
} else {
console.log('✅ All required files are present!');

// Check if index.html has the correct script tag
const indexPath = path.join(__dirname, 'dist/renderer/index.html');
const indexContent = fs.readFileSync(indexPath, 'utf-8');

console.log('\n📄 Checking index.html content:');
if (indexContent.includes('<script')) {
console.log('✅ Script tags found in index.html');
} else {
console.log('❌ No script tags found in index.html');
}
}