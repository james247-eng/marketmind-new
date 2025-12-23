// storageService.js
// Handles file uploads to Cloudflare R2

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize R2 client (S3-compatible)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY_ID || 'placeholder',
    secretAccessKey: import.meta.env.VITE_R2_SECRET_ACCESS_KEY || 'placeholder'
  }
});

// Upload file to R2
export const uploadFile = async (file, userId, businessId) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `users/${userId}/content/${businessId}/${timestamp}.${fileExtension}`;

    // Prepare upload command
    const command = new PutObjectCommand({
      Bucket: import.meta.env.VITE_R2_BUCKET_NAME || 'market-mind-media',
      Key: fileName,
      Body: file,
      ContentType: file.type
    });

    // Upload file
    await r2Client.send(command);

    // Generate public URL
    const fileUrl = `https://pub-${import.meta.env.VITE_R2_ACCOUNT_ID}.r2.dev/${fileName}`;

    return {
      success: true,
      url: fileUrl,
      fileName: fileName
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate file before upload
export const validateFile = (file, maxSizeMB = 10) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4'];
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, GIF, and MP4 are allowed.'
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  const maxSize = file.type.startsWith('video/') ? 50 : maxSizeMB;
  
  if (fileSizeMB > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize}MB.`
    };
  }

  return { valid: true };
};