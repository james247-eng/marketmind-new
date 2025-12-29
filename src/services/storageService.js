// storageService.js
// Handles file uploads to Cloudinary

import axios from 'axios';

// Upload file to Cloudinary (using unsigned upload preset)
export const uploadFile = async (file, userId, businessId) => {
  try {
    // Create FormData for Cloudinary upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    
    // Add custom folder structure (Cloudinary organizes by folder)
    formData.append('folder', `marketmind/users/${userId}/content/${businessId}`);
    
    // Add custom metadata tags
    formData.append('tags', `user:${userId},business:${businessId},marketplace`);
    
    // Upload to Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Return file info
    return {
      success: true,
      url: response.data.secure_url, // HTTPS URL
      publicId: response.data.public_id, // Cloudinary public ID (for later operations)
      fileName: response.data.original_filename,
      fileSize: response.data.bytes,
      format: response.data.format,
      width: response.data.width,
      height: response.data.height
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete file from Cloudinary (requires API secret - backend only)
export const deleteFile = async (publicId) => {
  // This requires backend implementation with API secret
  // Call from Cloud Function instead
  console.log('Use Cloud Function for deletions:', publicId);
};

// Get optimized image URL with transformations (client-side)
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 'auto',
    crop = 'fill'
  } = options;

  const baseUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
  
  // Build transformation string
  const transformations = `w_${width},h_${height},c_${crop},q_${quality}`;
  
  return `${baseUrl}/${transformations}/${publicId}`;
};

// Validate file before upload
export const validateFile = (file, maxSizeMB = 10) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPG, PNG, GIF, MP4, and MOV are allowed.'
    };
  }

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  const maxSize = file.type.startsWith('video/') ? 100 : maxSizeMB; // 100MB for videos, 10MB for images
  
  if (fileSizeMB > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize}MB.`
    };
  }

  return { valid: true };
};