# Quick Start Guide - RBAC & Encryption System

## 🚀 Quick Deployment (3 Steps)

### 1. Deploy Firebase Rules
```powershell
cd "c:\Users\hanep\Downloads\Telegram Desktop\FINAL YEAR PROJECT\FINAL YEAR PROJECT\react-cloud"
firebase deploy --only firestore:rules,storage:rules
```

### 2. Start Development Server
```powershell
npm run dev
```

### 3. Test the System
Login and test file upload → encryption → permission management → download

---

## 📋 What's New

### ✅ Complete RBAC System
- **Role-based access**: Admin, Editor, Viewer roles
- **User-specific access**: Assign files to individual users
- **Admin controls**: Manage who can see each file

### ✅ Client-Side Encryption
- **AES-256 encryption**: Military-grade encryption
- **User-controlled keys**: You manage your own keys
- **Secure storage**: Keys never stored in database

### ✅ Permission Management
- **Admin dashboard**: Comprehensive UI for file permissions
- **Dual control**: Set both role and user permissions
- **Real-time updates**: Changes reflect immediately

---

## 🎯 User Roles

| Role | Upload | Download | Manage Permissions | Manage Users |
|------|--------|----------|-------------------|--------------|
| **Admin** | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ❌ | ✅ | ❌ | ❌ |

---

## 📝 Quick How-To

### Upload a File
1. Click **Upload** tab
2. Drag & drop or select file
3. **Important**: Enter encryption key (remember this!)
4. Click Upload

### Download a File
1. Click download icon on file
2. Enter the encryption key you used
3. File downloads and decrypts automatically

### Share a File (Admin Only)
1. Click shield icon on file
2. Select:
   - **Roles**: Which roles can access (admin/editor/viewer)
   - **Users**: Specific users who can access
3. Click Save

---

## 🔐 Security Tips

1. **Choose Strong Keys**: Use at least 12 characters, mix letters/numbers/symbols
2. **Remember Your Keys**: Lost key = lost file access (no recovery)
3. **Don't Share Keys**: Each file should have unique key
4. **Test Downloads**: Always test download immediately after upload

---

## 🐛 Troubleshooting

### "Permission Denied" Error
→ Check your role (must be Admin or Editor to upload)

### "Missing encryption data" Error
→ File wasn't encrypted properly, re-upload with valid key

### Decryption Fails
→ Verify you're using the exact same key (case-sensitive)

### Files Not Showing
→ Check if file was shared with you in permissions

---

## 📱 Mobile/Responsive

The system works on all devices:
- ✅ Desktop browsers
- ✅ Mobile browsers
- ✅ Tablets
- ✅ Touch-enabled devices

---

## 🆘 Need Help?

1. Check `DEPLOYMENT_GUIDE.md` for detailed instructions
2. Check `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check Firebase Console for error logs
4. Review browser console for client errors

---

## 🎉 Ready to Use!

Your secure cloud storage system is ready. All features are production-ready and secured with Firebase rules.

**Next Step**: Deploy the rules and start using the system!
