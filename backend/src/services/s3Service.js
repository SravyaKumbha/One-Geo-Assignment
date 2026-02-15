const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');

async function uploadToS3(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType || 'application/octet-stream',
  });
  return s3Client.send(command);
}

async function downloadFromS3(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(command);
  return response.Body;
}

module.exports = { uploadToS3, downloadFromS3 };
