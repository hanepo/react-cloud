# SecureCloud - React Firebase App with 2FA and Client-side Encryption

A secure React TypeScript application featuring Firebase integration, Two-Factor Authentication (2FA), client-side AES-256 encryption, and Role-Based Access Control (RBAC).

## Features

- **🔐 Two-Factor Authentication (2FA)**: TOTP-based authentication using QR codes
- **🔒 Client-side Encryption**: AES-256 encryption of files before upload to Firebase Storage
- **👥 Role-Based Access Control**: Admin, Editor, and Viewer roles with different permissions
- **🔥 Firebase Integration**: Authentication, Firestore, and Cloud Storage
- **⚡ Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Backend**: Firebase (Auth, Firestore, Cloud Storage)
- **Encryption**: CryptoJS for AES-256 file encryption
- **UI**: Tailwind CSS, Lucide React icons
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM
- **2FA**: QRCode generation for TOTP setup

## Quick Start

### Prerequisites

- Node.js 18+ (recommended)
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-cloud
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase configuration:
```bash
cp .env.example .env
```

4. Update `.env` with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

5. Start the development server:
```bash
npm run dev
```

## Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Enable Cloud Storage
5. Update Firebase Security Rules (see below)

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        resource.data.role == 'admin' || 
        request.auth.uid == userId;
    }
    
    // Files can be accessed by the uploader or admins
    match /files/{fileId} {
      allow read, write: if request.auth != null && 
        resource.data.uploadedBy == request.auth.uid;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /files/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## User Roles

- **Admin**: Full access to all features, user management
- **Editor**: Can upload and manage their own files
- **Viewer**: Read-only access to their own files

## Security Features

### Client-side Encryption
- Files are encrypted with AES-256 before upload
- Encryption keys are stored in Firestore (in production, consider key management solutions)
- Only authorized users can decrypt and download files

### Two-Factor Authentication
- TOTP-based 2FA using authenticator apps
- QR code generation for easy setup
- Optional but recommended for enhanced security

### Role-Based Access Control
- Three-tier permission system
- Admin users can manage other users
- Secure role-based route protection

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/
│   ├── admin/          # Admin-only components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   ├── dashboard/      # Main dashboard
│   └── files/          # File management
├── contexts/           # React contexts
├── config/             # Configuration files
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Demo Credentials

For testing purposes, use:
- **2FA Token**: `123456` (demo token that will always work)
- **Admin Account**: Create any account and it will default to admin role
- **Test File Encryption**: Upload any file to see client-side encryption in action

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Security Considerations

- Environment variables for Firebase configuration
- Client-side encryption before cloud upload
- Secure Firebase security rules
- Input validation and sanitization
- HTTPS-only in production
- Regular dependency updates

## License

MIT License - see LICENSE file for details
