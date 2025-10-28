// types.ts
export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id?: string;                // Firestore doc id (optional)
  uid: string;                // Auth uid (required)
  email: string;
  displayName?: string;
  role: UserRole;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;   // stored only if user opted in (sensitive)
  createdAt: Date;
  lastLogin?: Date;
}

export interface Folder {
  id: string;
  name: string;
  path: string;               // Full path like "/folder1/subfolder2"
  parentId?: string | null;   // Parent folder ID, null for root folders
  createdBy: string;          // user id who created the folder
  createdAt: Date;
  // Permissions are optional — use RBAC fields on files for finer control,
  // but folders can also have a permissions set if you want inheritance.
  permissions?: {
    read?: string[];   // userIds or role names
    write?: string[];
    delete?: string[];
  };
}

export interface FileMetadata {
  id: string;
  name: string;               // stored/renamed file name
  originalName?: string;      // original filename from uploader
  type: string;               // mime type
  size: number;               // bytes
  lastModified?: number;      // epoch ms from client (optional)
  uploadedBy: string;         // user ID of the uploader
  uploadedAt: Date;           // Date or Firestore Timestamp (pick one)
  // Encrypted storage info
  encryptedPath?: string;     // path to encrypted file (if used)
  storagePath?: string;       // path in Firebase Storage
  downloadUrl?: string;       // temporary download URL (optional)
  iv?: string;                // initialization vector (hex/base64) - required for decryption
  // NOTE: do NOT store encryptionKey in DB. If you add it here, make sure it's encrypted and has a valid security model.
  encryptionKey?: string;     // OPTIONAL and discouraged — prefer KMS or client-side secret handling

  folderPath?: string;        // Path to the folder containing this file
  folderId?: string;          // ID of the folder containing this file

  // RBAC Fields: prefer these for access control
  allowedRoles?: UserRole[];  // roles allowed to access (e.g., ['admin', 'editor'])
  allowedUsers?: string[];    // specific user IDs allowed to access

  // Deprecated/legacy style permissions (kept optional for backward compat)
  permissions?: {
    read?: string[];   // userIds or role names
    write?: string[];
    delete?: string[];
  };
}

export interface TwoFactorSetup {
  secret: string;             // base32 or appropriate secret value
  qrCodeUrl: string;          // data URL or link to QR image
  backupCodes: string[];      // one-time backup codes
}

export interface LoginAttempt {
  email: string;
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}
