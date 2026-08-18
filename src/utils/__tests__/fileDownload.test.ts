import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  generateFilename,
  getExtensionFromMimeType,
  downloadFile,
  shareFile,
  downloadAndShare,
} from '../fileDownload';

// Mock modules
jest.mock('expo-file-system/legacy');
jest.mock('expo-sharing');

describe('fileDownload utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFilename', () => {
    it('should generate filename with timestamp and extension', () => {
      const result = generateFilename('TestReport', 'xlsx');
      expect(result).toMatch(/^TestReport_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should work with different extensions', () => {
      const pdfResult = generateFilename('Report', 'pdf');
      expect(pdfResult).toMatch(/^Report_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.pdf$/);

      const csvResult = generateFilename('Data', 'csv');
      expect(csvResult).toMatch(/^Data_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/);
    });
  });

  describe('getExtensionFromMimeType', () => {
    it('should return correct extension for excel', () => {
      const result = getExtensionFromMimeType(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(result).toBe('xlsx');
    });

    it('should return correct extension for pdf', () => {
      const result = getExtensionFromMimeType('application/pdf');
      expect(result).toBe('pdf');
    });

    it('should return correct extension for csv', () => {
      const result = getExtensionFromMimeType('text/csv');
      expect(result).toBe('csv');
    });

    it('should return bin for unknown mime types', () => {
      const result = getExtensionFromMimeType('unknown/type');
      expect(result).toBe('bin');
    });
  });

  describe('downloadFile', () => {
    const mockUrl = 'https://example.com/file.xlsx';
    const mockFileName = 'test-file.xlsx';

    beforeEach(() => {
      (FileSystem.cacheDirectory as any) = 'file://cache/';
    });

    it('should download file successfully', async () => {
      const mockDownloadResumable = {
        downloadAsync: jest.fn().mockResolvedValue({
          uri: 'file://cache/test-file.xlsx',
        }),
      };
      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue(
        mockDownloadResumable
      );

      const result = await downloadFile(mockUrl, mockFileName);

      expect(result.success).toBe(true);
      expect(result.uri).toBe('file://cache/test-file.xlsx');
      expect(FileSystem.createDownloadResumable).toHaveBeenCalledWith(
        mockUrl,
        'file://cache/test-file.xlsx',
        {},
        expect.any(Function)
      );
    });

    it('should handle download failure', async () => {
      const mockDownloadResumable = {
        downloadAsync: jest.fn().mockResolvedValue(null),
      };
      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue(
        mockDownloadResumable
      );

      const result = await downloadFile(mockUrl, mockFileName);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download gagal');
    });

    it('should handle errors', async () => {
      const mockDownloadResumable = {
        downloadAsync: jest.fn().mockRejectedValue(new Error('Network error')),
      };
      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue(
        mockDownloadResumable
      );

      const result = await downloadFile(mockUrl, mockFileName);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('shareFile', () => {
    it('should share file successfully', async () => {
      const mockFileUri = 'file://path/to/file.xlsx';
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await shareFile(mockFileUri, 'Test Share');

      expect(result).toBe(true);
      expect(Sharing.shareAsync).toHaveBeenCalledWith(mockFileUri, {
        dialogTitle: 'Test Share',
        UTI: 'public.item', // Default UTI value from implementation
      });
    });

    it('should return false if sharing is not available', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

      const result = await shareFile('file://path/to/file.xlsx');

      expect(result).toBe(false);
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('should handle sharing errors', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockRejectedValue(
        new Error('Share failed')
      );

      const result = await shareFile('file://path/to/file.xlsx');

      expect(result).toBe(false);
    });
  });

  describe('downloadAndShare', () => {
    const mockUrl = 'https://example.com/file.xlsx';
    const mockFileName = 'test-file.xlsx';

    beforeEach(() => {
      (FileSystem.cacheDirectory as any) = 'file://cache/';
    });

    it('should download and share file successfully', async () => {
      const mockDownloadResumable = {
        downloadAsync: jest.fn().mockResolvedValue({
          uri: 'file://cache/test-file.xlsx',
        }),
      };
      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue(
        mockDownloadResumable
      );
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

      const result = await downloadAndShare(mockUrl, mockFileName, 'Test');

      expect(result.success).toBe(true);
      expect(result.uri).toBe('file://cache/test-file.xlsx');
      expect(result.shared).toBe(true);
    });

    it('should return download error if download fails', async () => {
      const mockDownloadResumable = {
        downloadAsync: jest.fn().mockResolvedValue(null),
      };
      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue(
        mockDownloadResumable
      );

      const result = await downloadAndShare(mockUrl, mockFileName);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Download gagal');
      expect(result.shared).toBeUndefined();
    });
  });
});
