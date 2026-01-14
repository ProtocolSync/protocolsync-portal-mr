const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '../apps/portal-mobile/android/app/src/main/AndroidManifest.xml');

if (fs.existsSync(manifestPath)) {
  console.log('Fixing Android Manifest at:', manifestPath);
  let content = fs.readFileSync(manifestPath, 'utf8');
  
  if (content.includes('android:path="/undefined"')) {
    console.log('Found /undefined path. Replacing with correct hash...');
    content = content.replace('android:path="/undefined"', 'android:path="/Xo8WBi6jzSxKDVR4drqm84yr9iU="');
    fs.writeFileSync(manifestPath, content);
    console.log('Manifest fixed successfully.');
  } else if (content.includes('android:path="/Xo8WBi6jzSxKDVR4drqm84yr9iU="')) {
      console.log('Manifest already has correct path.');
  } else {
    console.log('Pattern not found. Dumping content snippet for debug:');
    const match = content.match(/android:path="[^"]*"/);
    console.log(match ? match[0] : 'No android:path found on data tag?');
  }
} else {
  console.error('Manifest file not found at:', manifestPath);
  process.exit(1);
}
