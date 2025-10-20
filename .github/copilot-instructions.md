# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React TypeScript application with Firebase integration featuring:

## Security Features
- **2FA Authentication**: Time-based One-Time Password (TOTP) using QR codes for secure login
- **Client-side Encryption**: AES-256 encryption of files before uploading to Firebase Cloud Storage
- **Role-Based Access Control (RBAC)**: Admin, Editor, and Viewer roles with different permissions

## Technology Stack
- **Frontend**: React with TypeScript, Vite build tool
- **Backend**: Firebase (Auth, Firestore, Cloud Storage)
- **Encryption**: CryptoJS for AES-256 file encryption
- **UI Components**: Lucide React icons, React Hot Toast for notifications
- **Routing**: React Router DOM

## Key Components
- Authentication with 2FA setup and verification
- File upload with client-side encryption
- Role management system
- Secure file sharing with encrypted storage
- User dashboard with role-based features

## Development Guidelines
- Follow TypeScript best practices
- Use Firebase security rules for additional backend protection
- Implement proper error handling and user feedback
- Ensure all sensitive operations are logged for security auditing
- Use environment variables for Firebase configuration
