// storage.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Load your service account credentials
const storage = new Storage({
  keyFilename: path.join(__dirname, 'path-to-your-service-account.json'),
  projectId: 'your-google-cloud-project-id',
});

const bucketName = 'your-bucket-name';
const bucket = storage.bucket(bucketName);

const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    const { originalname, buffer } = file;
    const blob = bucket.file(originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => reject(err));
    blobStream.on('finish', () => {
      // Make the file publicly accessible and return the public URL
      blob.makePublic().then(() => {
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
        resolve(publicUrl);
      });
    });
    blobStream.end(buffer);
  });
};

module.exports = { uploadToGCS };
