const https = require('https');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const targetDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
];

async function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(targetDir, filename);
    const file = fs.createWriteStream(filePath);
    console.log(`Downloading ${filename}...`);
    
    https.get(baseUrl + filename, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Finished ${filename}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    for (const file of files) {
      await downloadFile(file);
    }
    console.log('All models downloaded successfully!');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
