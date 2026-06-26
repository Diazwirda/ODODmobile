export interface ImageFile {
  uri: string;
  type: 'image/jpeg' | 'image/png' | 'image/webp';
  name: string;
  size: number; // dalam bytes
}

export interface Department {
  id: number;
  name: string;
}

export interface NormalizedError {
  message: string;
  statusCode: number | null;
  validationErrors: Record<string, string[]> | null;
}
