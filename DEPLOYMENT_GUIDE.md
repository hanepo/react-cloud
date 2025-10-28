# Firebase Rules Deployment Guide

## Overview
This guide explains how to deploy the Firestore and Storage security rules to your Firebase project.

## What Was Implemented

### 1. ✅ Firestore Security Rules (`firestore.rules`)
- **RBAC Implementation**: Role-based and user-specific access control
- **File Access Control**: Files are accessible based on:
  - File owner (uploadedBy field)
  - Users in allowedUsers array
  - Users whose role is in allowedRoles array
  - Admins always have access to all files
- **User Management**: Admins can manage all users, users can read/update their own data
- **Folder Permissions**: Owners and admins can manage folders

### 2. ✅ Storage Security Rules (`storage.rules`)
- **Path-based Access**: Files stored in `files/{userId}/` paths
- **Owner Access**: Users can read/write their own files
- **Admin Override**: Admins have full access to all storage

### 3. ✅ Client-Side Encryption
- **AES-256 Encryption**: Files encrypted before upload
- **User-Provided Keys**: Users enter encryption key during upload
- **IV Storage**: Initialization vector stored in Firestore (NOT the key)
- **Decryption Prompt**: Modal prompts for key when downloading

### 4. ✅ RBAC with Per-User File Access
- **Role-Based Permissions**: Admin can assign access by role (admin, editor, viewer)
- **User-Specific Permissions**: Admin can assign access to individual users
- **Dual Query System**: Fetches both owned files and files shared with user
- **Admin UI**: Comprehensive modal for managing both roles and users

### 5. ✅ Dashboard Upload Access
- **Tab-Based Navigation**: Upload tab visible for admins and editors
- **Role-Based Visibility**: Viewers cannot see upload tab

## Deployment Steps

### Step 1: Install Firebase CLI (if not installed)
```powershell
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```powershell
firebase login
```

### Step 3: Initialize Firebase in Your Project (if not already done)
```powershell
# Run from project root directory
cd "c:\Users\hanep\Downloads\Telegram Desktop\FINAL YEAR PROJECT\FINAL YEAR PROJECT\react-cloud"
firebase init
```

When prompted:
- Select **Firestore** and **Storage**
- Choose your existing Firebase project
- Accept default paths for rules files (`firestore.rules` and `storage.rules`)
- **Do NOT overwrite** the rules files (we already created them)

### Step 4: Deploy Firestore Rules
```powershell
firebase deploy --only firestore:rules
```

Expected output:
```
✔ Deploy complete!
Firestore rules deployed successfully
```

### Step 5: Deploy Storage Rules
```powershell
firebase deploy --only storage:rules
```

Expected output:
```
✔ Deploy complete!
Storage rules deployed successfully
```

### Step 6: Deploy Both Rules at Once (Alternative)
```powershell
firebase deploy --only firestore:rules,storage:rules
```

## Verify Deployment

### 1. Check Firestore Rules in Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project
3. Navigate to **Firestore Database** > **Rules**
4. Verify the rules match your `firestore.rules` file

### 2. Check Storage Rules in Firebase Console
1. In Firebase Console, go to **Storage** > **Rules**
2. Verify the rules match your `storage.rules` file

## Testing the RBAC System

### Test 1: File Upload with Encryption
1. Login as an **admin** or **editor**
2. Go to **Upload** tab
3. Select a file
4. Enter an encryption key (minimum 8 characters)
5. Upload the file
6. Verify file appears in **Files** tab with a lock icon

### Test 2: Permission Management (Admin Only)
1. Login as an **admin**
2. Go to **Files** tab
3. Click on a file's permission icon (shield icon)
4. In the modal:
   - Check/uncheck roles (admin, editor, viewer)
   - Check/uncheck specific users
5. Save permissions
6. Verify permissions are saved

### Test 3: File Download with Decryption
1. Click download on an encrypted file
2. Modal prompts for decryption key
3. Enter the key you used during upload
4. File downloads and decrypts successfully
5. If wrong key entered, decryption fails with error

### Test 4: Shared File Access
1. As admin, upload a file
2. Share it with a specific user (add to allowedUsers)
3. Login as that user
4. Verify the file appears in their Files tab
5. Verify they can download it with the correct key

### Test 5: Role-Based Access
1. As admin, upload a file
2. Set allowedRoles to only include "viewer"
3. Login as a viewer user
4. Verify they can see and download the file
5. Login as an editor (not in allowedRoles)
6. Verify they CANNOT see the file

## Security Considerations

### ✅ What's Secure
- **Encryption keys NOT stored in database**: Users must remember their keys
- **Server-side rule enforcement**: Firestore and Storage rules enforce RBAC
- **Client-side encryption**: Files encrypted before leaving the client
- **Admin-only permission management**: Only admins can modify file access

### ⚠️ Important Security Notes
1. **Key Management**: Users are responsible for their encryption keys
   - Lost keys = lost access to files
   - Consider implementing a secure key storage solution for production
   
2. **Storage Rules Limitation**: 
   - Storage rules check owner/admin access
   - For full RBAC in storage, consider using signed URLs from Cloud Functions

3. **Production Recommendations**:
   - Implement key derivation (PBKDF2, Argon2)
   - Add file metadata encryption
   - Implement audit logging
   - Add rate limiting
   - Use Cloud Functions for sensitive operations

## Troubleshooting

### Issue: "Permission Denied" when uploading files
**Solution**: Make sure you're logged in as an admin or editor. Check your user role in Firestore.

### Issue: "Missing environment variables" error
**Solution**: Verify your `.env` file has all required Firebase config variables.

### Issue: Files not showing after upload
**Solution**: 
1. Check browser console for errors
2. Verify Firestore rules are deployed
3. Check that allowedUsers array includes your user ID

### Issue: Decryption fails with correct key
**Solution**: 
1. Verify IV was stored correctly in Firestore
2. Check that file wasn't corrupted during upload
3. Ensure key is exactly the same (case-sensitive)

## Firebase Console Access

- **Firestore Database**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
- **Storage**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/storage
- **Rules Testing**: Use the Firebase Console's Rules Playground to test rules before deployment

## Next Steps (Optional Enhancements)

1. **Implement Key Recovery**: Add backup codes or key recovery mechanism
2. **Add Audit Logs**: Track file access and permission changes
3. **Implement File Sharing Links**: Generate temporary share links with Cloud Functions
4. **Add File Versioning**: Keep track of file versions and changes
5. **Implement Quota Management**: Limit storage per user/role
6. **Add Real-time Notifications**: Notify users when files are shared with them

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Review browser console logs
3. Verify all environment variables are set
4. Ensure Firebase CLI is up to date: `npm install -g firebase-tools@latest`
