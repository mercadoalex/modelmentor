// Content moderation utilities
const INAPPROPRIATE_WORDS = [
  'badword1', 'badword2', 'offensive', 'hate', 'racist'
];

export const contentModeration = {
  checkText(text: string): { isClean: boolean; reason?: string } {
    const lowerText = text.toLowerCase();
    
    for (const word of INAPPROPRIATE_WORDS) {
      if (lowerText.includes(word)) {
        return {
          isClean: false,
          reason: 'Text contains inappropriate language'
        };
      }
    }
    
    return { isClean: true };
  },

  async checkImage(file: File): Promise<{ isClean: boolean; reason?: string }> {
    // Basic image validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      return {
        isClean: false,
        reason: 'Invalid image format. Please upload JPEG, PNG, GIF, or WEBP'
      };
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isClean: false,
        reason: 'Image size exceeds 10MB limit'
      };
    }
    
    return { isClean: true };
  }
};

export const dataValidation = {
  validateImageDataset(files: File[]): { isValid: boolean; message?: string } {
    if (files.length < 10) {
      return {
        isValid: false,
        message: 'Image classification requires at least 10 images per class'
      };
    }
    
    return { isValid: true };
  },

  validateTextDataset(samples: string[]): { isValid: boolean; message?: string } {
    if (samples.length < 20) {
      return {
        isValid: false,
        message: 'Text classification requires at least 20 text samples per class'
      };
    }
    
    return { isValid: true };
  },

  validateRegressionDataset(dataPoints: number): { isValid: boolean; message?: string } {
    if (dataPoints < 50) {
      return {
        isValid: false,
        message: 'Regression requires at least 50 data points'
      };
    }
    
    return { isValid: true };
  }
};

export const imageCompression = {
  async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize to max 1080p
          const maxDimension = 1080;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/webp',
                lastModified: Date.now()
              });
              
              resolve(compressedFile);
            },
            'image/webp',
            0.8
          );
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
};
