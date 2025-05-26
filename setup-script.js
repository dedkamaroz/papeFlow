const fs = require('fs');
const path = require('path');

// Create directory structure
const directories = [
  'src/main/database',
  'src/main/ipc',
  'src/renderer/components/FlowCanvas',
  'src/renderer/components/Editor',
  'src/renderer/components/Checklist',
  'src/renderer/components/Media',
  'src/renderer/components/Layout',
  'src/renderer/stores',
  'src/renderer/hooks',
  'src/renderer/utils',
  'src/renderer/pages',
  'src/renderer/styles',
  'src/shared/types',
  'src/shared/constants',
  'public',
  'dist',
];

directories.forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
  console.log(`Created directory: ${dir}`);
});

console.log('\n✅ Directory structure created!');
console.log('\n📝 Next steps:');
console.log('1. Copy all the file contents from the artifacts above into their respective files');
console.log('2. Run: npm install');
console.log('3. Run: npm run dev');
console.log('\n🎉 Your process flow app will be ready to use!');
