const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require('crypto');

// Initialize S3 client with AWS SDK v3
const s3 = new S3Client({ 
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

const S3_BUCKET = "swap-sphere0";
const S3_URL_PREFIX = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com`;

/**
 * Upload an image to S3 bucket
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - S3 URL of uploaded image
 */
const uploadImage = async (fileBuffer, fileName, mimeType) => {
  try {
    // Generate unique file name
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `listings/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    // Upload parameters (AWS SDK v3)
    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: mimeType,
    };

    // Upload to S3 using AWS SDK v3
    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);
    
    return `${S3_URL_PREFIX}/${uniqueFileName}`; // Return S3 URL
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3: ' + error.message);
  }
};

/**
 * Delete an image from S3 bucket using AWS SDK v3
 * @param {string} imageUrl - S3 URL of image to delete
 * @returns {Promise<boolean>} - Success status
 */
const deleteImage = async (imageUrl) => {
  try {
    // Extract key from S3 URL
    const urlParts = imageUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get 'listings/filename.ext'

    const deleteParams = {
      Bucket: S3_BUCKET,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3.send(command);
    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    return false;
  }
};

/**
 * Generate a pre-signed URL for direct upload (optional for future use)
 * @param {string} fileName - File name
 * @param {string} mimeType - File mime type
 * @returns {Promise<string>} - Pre-signed URL
 */
const getUploadUrl = async (fileName, mimeType) => {
  try {
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `listings/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    const uploadParams = {
      Bucket: S3_BUCKET,
      Key: uniqueFileName,
      ContentType: mimeType,
      Expires: 60, // URL expires in 60 seconds
    };

    const signedUrl = await s3.getSignedUrlPromise('putObject', uploadParams);
    return signedUrl;
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    throw new Error('Failed to generate upload URL');
  }
};

/**
 * Generate signed URL for S3 object access using AWS SDK v3
 * @param {string} key - S3 object key
 * @returns {Promise<string>} - Signed URL
 */
const generateSignedUrl = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Failed to generate signed URL: ' + error.message);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  getSignedUrl: generateSignedUrl,
  getUploadUrl,
  S3_BUCKET,
  S3_URL_PREFIX,
};
