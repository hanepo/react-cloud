export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface Folder {
  id: string;
  name: string;
  path: string; // Full path like "/folder1/subfolder2"
  parentId?: string; // Parent folder ID, null for root folders
  createdBy: string;
  createdAt: Date;
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
  };
}

export interface FileMetadata {
  id: string;
  name: string;
  originalName?: string;
  type: string;
  size: number;
  lastModified: number;
  uploadedBy: string;
  uploadedAt: Date;
  encryptedPath: string;
  storagePath?: string;
  downloadUrl?: string;
  encryptionKey?: string;
  iv?: string;
  folderPath?: string; // Path to the folder containing this file
  folderId?: string; // ID of the folder containing this file
  permissions: {
    read: string[];
    write: string[];
    delete: string[];
  };
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}
