/**
 * File Download Utilities
 * 
 * Helper functions for downloading and sharing files in React Native
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

interface DownloadResult {
  success: boolean;
  uri?: string;
  error?: string;
}

/**
 * Download file from URL and save to device
 * @param url - Remote URL to download from
 * @param filename - Local filename to save as
 * @param onProgress - Optional callback for download progress
 * @returns Promise with download result
 */
export const downloadFile = async (
  url: string,
  filename: string,
  onProgress?: (progress: number) => void,
): Promise<DownloadResult> => {
  try {
    // Ensure FileSystem directories are available
    if (!FileSystem.documentDirectory && !FileSystem.cacheDirectory) {
      return {
        success: false,
        error: 'File system tidak tersedia',
      };
    }

    // Use cache directory for temporary downloads
    const fileUri = (FileSystem.cacheDirectory || FileSystem.documentDirectory) + filename;

    // Create download with progress callback
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress =
            downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress(progress);
        }
      },
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      return {
        success: false,
        error: 'Download gagal',
      };
    }

    return {
      success: true,
      uri: result.uri,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download gagal',
    };
  }
};

/**
 * Share file with system share dialog
 * @param fileUri - Local file URI to share
 * @param dialogTitle - Optional dialog title (Android only)
 * @returns Promise indicating if sharing was successful
 */
export const shareFile = async (
  fileUri: string,
  dialogTitle?: string,
): Promise<boolean> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      return false;
    }

    await Sharing.shareAsync(fileUri, {
      dialogTitle: dialogTitle || 'Bagikan File',
      UTI: Platform.OS === 'ios' ? 'public.item' : undefined,
    });

    return true;
  } catch (error) {
    console.error('Error sharing file:', error);
    return false;
  }
};

/**
 * Download file and immediately share it
 * @param url - Remote URL to download from
 * @param filename - Local filename
 * @param dialogTitle - Optional share dialog title
 * @returns Promise with result
 */
export const downloadAndShare = async (
  url: string,
  filename: string,
  dialogTitle?: string,
): Promise<DownloadResult & { shared?: boolean }> => {
  const downloadResult = await downloadFile(url, filename);

  if (!downloadResult.success || !downloadResult.uri) {
    return downloadResult;
  }

  const shared = await shareFile(downloadResult.uri, dialogTitle);

  return {
    ...downloadResult,
    shared,
  };
};

/**
 * Get file extension from MIME type
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-excel': 'xls',
    'text/csv': 'csv',
    'application/json': 'json',
    'text/plain': 'txt',
  };

  return mimeMap[mimeType] || 'bin';
};

/**
 * Generate safe filename with timestamp
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
};
