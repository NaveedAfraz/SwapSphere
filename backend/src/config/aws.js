const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// S3 bucket configuration
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'swapsphere-listings';
const S3_URL_PREFIX = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;

module.exports = {
  s3,
  S3_BUCKET,
  S3_URL_PREFIX,
};
