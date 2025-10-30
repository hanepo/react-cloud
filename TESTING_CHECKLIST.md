# React Cloud Storage - Complete Testing Checklist

## Project Status: READY FOR TESTING ✅

### Build Status
- ✅ TypeScript compilation: SUCCESS
- ✅ Vite build: SUCCESS
- ✅ Development server: RUNNING on http://localhost:5173/
- ✅ All dependencies installed
- ✅ Firebase configured

---

## 1. AUTHENTICATION TESTING

### 1.1 Sign Up Flow
- [ ] Open http://localhost:5173/signup
- [ ] Test empty form submission (should show validation errors)
- [ ] Test invalid email format (e.g., "test@")
- [ ] Test password < 6 characters (should show error)
- [ ] Test password mismatch (password !== confirmPassword)
- [ ] Test successful sign up with valid data:
  - Email: test@example.com
  - Password: test123456
  - Display Name: Test User
- [ ] Verify redirect to /dashboard after signup
- [ ] Verify user appears in Firestore 'users' collection
- [ ] Verify default role is 'viewer'

### 1.2 Sign In Flow
- [ ] Navigate to http://localhost:5173/signin
- [ ] Test empty form submission
- [ ] Test invalid credentials (wrong password)
- [ ] Test sign in with correct credentials
- [ ] Verify redirect to /dashboard
- [ ] Verify user session persists on page reload

### 1.3 Two-Factor Authentication (2FA)
- [ ] After signup, navigate to /setup-2fa
- [ ] Verify QR code is generated and displayed
- [ ] Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
- [ ] Copy secret key manually if QR scan fails
- [ ] Enter 6-digit code from authenticator
- [ ] Test wrong code (should show error)
- [ ] Test correct code (should enable 2FA)
- [ ] Sign out and sign in again
- [ ] Verify 2FA code is now required during login
- [ ] Test login with wrong 2FA code
- [ ] Test login with correct 2FA code

---

## 2. DASHBOARD & NAVIGATION TESTING

### 2.1 Dashboard Layout
- [ ] Verify dashboard loads at /dashboard
- [ ] Check header displays "SecureCloud" logo
- [ ] Check user email is displayed in top-right
- [ ] Check user role badge is displayed
- [ ] Check 2FA shield icon appears if 2FA enabled
- [ ] Check dropdown menu works on click

### 2.2 Tab Navigation (Viewer Role)
- [ ] Verify "Files" tab is visible
- [ ] Verify "Upload" tab is NOT visible
- [ ] Verify "Users" tab is NOT visible
- [ ] Verify "Profile" tab is visible

### 2.3 Tab Navigation (Editor Role)
To test: Update user role in Firestore or create new user with editor role
- [ ] Verify "Files" tab is visible
- [ ] Verify "Upload" tab IS visible
- [ ] Verify "Users" tab is NOT visible
- [ ] Verify "Profile" tab is visible

### 2.4 Tab Navigation (Admin Role)
To test: Update user role to 'admin' in Firestore
- [ ] Verify all tabs are visible: Files, Upload, Users, Profile
- [ ] Test switching between all tabs

---

## 3. FILE MANAGEMENT TESTING

### 3.1 Folder Operations
- [ ] Click on folder tree area
- [ ] Create new folder: "Test Folder 1"
- [ ] Verify folder appears in tree
- [ ] Create subfolder inside "Test Folder 1"
- [ ] Test folder expansion/collapse icons
- [ ] Select folder in tree
- [ ] Delete empty folder
- [ ] Try to delete non-empty folder (should warn/prevent)

### 3.2 File Upload (Requires Editor or Admin role)
- [ ] Navigate to "Upload" tab
- [ ] Test drag and drop a file
- [ ] Click to browse and select file
- [ ] Verify file appears in upload list
- [ ] Try to upload WITHOUT encryption key (should show error)
- [ ] Enter encryption key (min 8 characters): "TestKey12345"
- [ ] Click "Upload" button
- [ ] Verify upload progress shows
- [ ] Verify success toast message
- [ ] Navigate to "Files" tab
- [ ] Verify uploaded file appears in file list

### 3.3 File Upload - Multiple Files
- [ ] Select multiple files at once
- [ ] Enter encryption key for each file
- [ ] Click "Upload All Pending"
- [ ] Verify all files upload successfully
- [ ] Check Files tab for all uploaded files

### 3.4 File Upload to Folder
- [ ] Create a new folder: "Documents"
- [ ] Go to Upload tab
- [ ] Select folder from dropdown: "Documents"
- [ ] Upload file with encryption key
- [ ] Go to Files tab
- [ ] Navigate to "Documents" folder
- [ ] Verify file is in the folder

### 3.5 File Download & Decryption
- [ ] Click download button on any file
- [ ] Verify decryption key modal appears
- [ ] Try wrong key first (should show error)
- [ ] Enter correct encryption key used during upload
- [ ] Click download
- [ ] Verify file downloads correctly
- [ ] Open downloaded file to confirm it's decrypted properly

### 3.6 File Deletion
- [ ] Click delete button on a file
- [ ] Verify confirmation dialog appears
- [ ] Cancel deletion
- [ ] Click delete again
- [ ] Confirm deletion
- [ ] Verify file is removed from list
- [ ] Verify file is deleted from Firebase Storage (check console)

### 3.7 File List View Options
- [ ] Test search functionality (search by filename)
- [ ] Test list view vs grid view toggle
- [ ] Test sorting by:
  - Name (A-Z and Z-A)
  - Size (smallest/largest)
  - Date (oldest/newest)
  - Type

---

## 4. PERMISSIONS MANAGEMENT TESTING (Admin Only)

### 4.1 Setup for Testing
- [ ] Ensure you're logged in as admin
- [ ] Create test users with different roles:
  - editor@test.com (editor role)
  - viewer@test.com (viewer role)
- [ ] Upload a test file

### 4.2 Permission Modal
- [ ] Click shield icon on a file
- [ ] Verify permission modal opens
- [ ] Verify all roles are shown: admin, editor, viewer
- [ ] Verify list of all users is displayed

### 4.3 Role-Based Permissions
- [ ] Select "viewer" role checkbox
- [ ] Save permissions
- [ ] Verify success message
- [ ] Sign out
- [ ] Sign in as viewer@test.com
- [ ] Verify file is now visible in Files tab
- [ ] Sign out and back in as admin
- [ ] Remove viewer role permission
- [ ] Sign in as viewer again
- [ ] Verify file is no longer visible

### 4.4 User-Specific Permissions
- [ ] As admin, open file permissions
- [ ] Uncheck all roles
- [ ] Select specific user: editor@test.com
- [ ] Save permissions
- [ ] Sign in as editor@test.com
- [ ] Verify file IS visible
- [ ] Sign in as viewer@test.com
- [ ] Verify file is NOT visible

### 4.5 Combined Permissions
- [ ] Set both role permissions (editor) AND user permissions (specific viewer)
- [ ] Verify both editor role AND specific viewer can see file
- [ ] Verify other viewers cannot see file

---

## 5. USER MANAGEMENT TESTING (Admin Only)

### 5.1 User List View
- [ ] Navigate to "Users" tab as admin
- [ ] Verify statistics cards show:
  - Total Users
  - Admins count
  - Editors count
  - Viewers count
- [ ] Verify all users are listed in table

### 5.2 Role Management
- [ ] Click edit/role dropdown on a user
- [ ] Change user role from viewer to editor
- [ ] Verify success message
- [ ] Verify role badge updates
- [ ] Sign in as that user
- [ ] Verify Upload tab is now visible

### 5.3 User Deletion
- [ ] Try to delete your own admin account (should prevent)
- [ ] Click delete on another user
- [ ] Confirm deletion
- [ ] Verify user is removed from list
- [ ] Try to sign in as deleted user (should fail)

### 5.4 User Information Display
- [ ] Verify each user shows:
  - Email
  - Display name
  - Role badge
  - 2FA status (shield icon)
  - Created date
  - Last login date

---

## 6. ROLE-BASED ACCESS CONTROL (RBAC) TESTING

### 6.1 Viewer Role Limitations
- [ ] Sign in as viewer
- [ ] Verify cannot see Upload tab
- [ ] Verify cannot see Users tab
- [ ] Verify can only view files shared with them
- [ ] Verify can download files (with correct key)
- [ ] Try to access /upload directly via URL (should redirect/deny)

### 6.2 Editor Role Permissions
- [ ] Sign in as editor
- [ ] Verify CAN upload files
- [ ] Verify CAN create folders
- [ ] Verify CAN delete own files
- [ ] Verify CANNOT see Users tab
- [ ] Verify CANNOT manage permissions (no shield icon on files)

### 6.3 Admin Role Permissions
- [ ] Sign in as admin
- [ ] Verify CAN access all tabs
- [ ] Verify CAN upload files
- [ ] Verify CAN manage all users
- [ ] Verify CAN see ALL files (owned + shared)
- [ ] Verify CAN manage file permissions
- [ ] Verify CAN delete any file

---

## 7. SECURITY TESTING

### 7.1 Encryption Testing
- [ ] Upload file with key "SecureKey123"
- [ ] Check Firebase Storage (file should be encrypted blob)
- [ ] Try to download without key (should require key)
- [ ] Try to download with wrong key (should fail)
- [ ] Download with correct key (should succeed)
- [ ] Verify IV is stored in Firestore (not the key)

### 7.2 Authentication Security
- [ ] Try to access /dashboard without logging in (should redirect to /signin)
- [ ] Try to access /setup-2fa without logging in (should redirect)
- [ ] Verify session persists across page reloads
- [ ] Sign out and verify redirect to sign in

### 7.3 Firebase Rules Testing (If deployed)
- [ ] Try to access another user's file via direct Firestore query
- [ ] Try to delete another user's file via Firestore
- [ ] Try to modify user roles via Firestore as non-admin

---

## 8. UI/UX TESTING

### 8.1 Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px width)
- [ ] Test on mobile (375px width)
- [ ] Verify all elements are accessible
- [ ] Verify no horizontal scrolling
- [ ] Verify buttons are tapable on mobile

### 8.2 Form Validation
- [ ] Test all required fields show errors when empty
- [ ] Test email validation
- [ ] Test password strength indicators (if any)
- [ ] Test error messages are clear and helpful

### 8.3 User Feedback
- [ ] Verify success toasts appear for all successful actions
- [ ] Verify error toasts appear for all failures
- [ ] Verify loading indicators appear during operations
- [ ] Verify confirmation dialogs for destructive actions

### 8.4 Accessibility
- [ ] Test keyboard navigation (Tab key)
- [ ] Test screen reader compatibility (if possible)
- [ ] Verify form labels are properly associated
- [ ] Verify color contrast is sufficient

---

## 9. ERROR HANDLING TESTING

### 9.1 Network Errors
- [ ] Disconnect internet
- [ ] Try to upload file (should show error)
- [ ] Try to load files (should show error)
- [ ] Reconnect and verify recovery

### 9.2 Invalid Data
- [ ] Try to upload 0-byte file
- [ ] Try to upload very large file (>100MB)
- [ ] Try to create folder with invalid characters
- [ ] Try to create duplicate folder name

### 9.3 Edge Cases
- [ ] Upload file with special characters in name
- [ ] Upload file with very long name
- [ ] Create deeply nested folder structure
- [ ] Upload file to deleted folder (if folder deleted during upload)

---

## 10. PERFORMANCE TESTING

### 10.1 Load Testing
- [ ] Upload 20+ files
- [ ] Verify file list loads quickly
- [ ] Test search with many files
- [ ] Test sorting with many files

### 10.2 File Size Testing
- [ ] Upload small file (< 1KB)
- [ ] Upload medium file (1-10MB)
- [ ] Upload large file (50-100MB)
- [ ] Monitor upload progress
- [ ] Verify all sizes work correctly

---

## 11. BROWSER COMPATIBILITY TESTING

### 11.1 Desktop Browsers
- [ ] Google Chrome (latest)
- [ ] Mozilla Firefox (latest)
- [ ] Microsoft Edge (latest)
- [ ] Safari (if available)

### 11.2 Mobile Browsers
- [ ] Chrome on Android
- [ ] Safari on iOS
- [ ] Firefox on Android

---

## BUGS FOUND & FIXED

### Compilation Errors Fixed ✅
1. ✅ Removed unused `useRef` import in SignIn.tsx
2. ✅ Removed unused `ArrowLeft` import in TwoFactorSetup.tsx
3. ✅ Removed unused `UserRole` import in FileUpload.tsx
4. ✅ Fixed `encryptedData` null check in FileUpload.tsx (line 150)
5. ✅ Fixed `encryptedData` null check for iv in FileUpload.tsx (line 177)

### Runtime Issues to Monitor
- [ ] Check browser console for any runtime errors
- [ ] Monitor Firebase console for rule violations
- [ ] Check Network tab for failed requests

---

## DEPLOYMENT CHECKLIST

### Before Deployment
- [ ] Review all Firebase security rules
- [ ] Deploy Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage rules: `firebase deploy --only storage:rules`
- [ ] Set up Firebase hosting (if using)
- [ ] Update environment variables for production
- [ ] Remove debug/test code
- [ ] Remove console.log statements
- [ ] Test production build: `npm run build`
- [ ] Test preview: `npm run preview`

### After Deployment
- [ ] Test all critical paths on production
- [ ] Verify Firebase security rules are active
- [ ] Monitor Firebase usage and errors
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Document known limitations
- [ ] Create user guide/documentation

---

## FINAL CHECKLIST

- [ ] All TypeScript errors resolved
- [ ] All runtime errors fixed
- [ ] All features tested and working
- [ ] Documentation completed
- [ ] README updated with setup instructions
- [ ] Firebase rules deployed
- [ ] Production build successful
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] User feedback incorporated

---

## Testing Notes

**How to Test:**
1. Open terminal and run: `npm run dev`
2. Open browser to: http://localhost:5173/
3. Follow each checklist item sequentially
4. Mark items as complete: `- [x]` when done
5. Document any bugs found in "Bugs Found & Fixed" section

**Test Data:**
- Test Email: test@example.com
- Test Password: test123456
- Encryption Key: TestKey12345
- 2FA: Use Google Authenticator or similar app

**Firebase Console:**
- URL: https://console.firebase.google.com/
- Project: cloud-fs-dev
- Check: Authentication, Firestore, Storage tabs

---

**Testing Started:** [DATE]
**Testing Completed:** [DATE]
**Tested By:** [NAME]
**Status:** IN PROGRESS / COMPLETED / FAILED
