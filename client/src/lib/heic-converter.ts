import heic2any from 'heic2any';

/**
 * Converts HEIC files to JPEG format for web compatibility
 * @param file - The HEIC file to convert
 * @returns Promise<string> - Data URL of the converted JPEG image
 */
export async function convertHeicToJpeg(file: File): Promise<string> {
  try {
    // Check if the file is HEIC
    const isHeic = file.type === 'image/heic' || 
                   file.type === 'image/heif' || 
                   file.name.toLowerCase().endsWith('.heic') || 
                   file.name.toLowerCase().endsWith('.heif');

    if (!isHeic) {
      // If not HEIC, return the original file as data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    console.log('Converting HEIC file:', file.name);
    
    // Convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    // Handle both single blob and array of blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    console.error('Error converting HEIC file:', error);
    throw new Error('Failed to convert HEIC file. Please try a different image format.');
  }
}

/**
 * Checks if a file is a supported image format (including HEIC)
 * @param file - The file to check
 * @returns boolean - True if the file is a supported image format
 */
export function isSupportedImageFile(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif'
  ];

  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
  
  return supportedTypes.includes(file.type) || 
         supportedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}