import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { encryptFile } from '../../utils/encryption';
import { Upload, X, File, CheckCircle, AlertCircle, Folder } from 'lucide-react';
import type { Folder as FolderType } from '../../types';
import toast from 'react-hot-toast';

interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProps {
  selectedFolderId?: string | null;
  onUploadComplete?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ selectedFolderId, onUploadComplete }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(selectedFolderId || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user's folders
  React.useEffect(() => {
    if (!currentUser) return;

    const foldersQuery = query(
      collection(db, 'folders'),
      where('createdBy', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(foldersQuery, (snapshot) => {
      const folderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FolderType[];
      
      setFolders(folderList);
    });

    return unsubscribe;
  }, [currentUser]);

  // Update current folder when prop changes
  React.useEffect(() => {
    setCurrentFolderId(selectedFolderId || null);
  }, [selectedFolderId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (selectedFiles: File[]) => {
    const newFiles = selectedFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileState: FileUploadState, index: number) => {
    if (!currentUser) {
      toast.error('Not authenticated');
      return;
    }

    const updateFileState = (updates: Partial<FileUploadState>) => {
      setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
    };

    try {
      updateFileState({ status: 'uploading', progress: 10 });

      // Generate encryption key and encrypt file
      const encryptionKey = crypto.getRandomValues(new Uint8Array(32));
      const keyHex = Array.from(encryptionKey).map(b => b.toString(16).padStart(2, '0')).join('');
      
      updateFileState({ progress: 30 });

      // Read file as ArrayBuffer and encrypt
      const fileBuffer = await fileState.file.arrayBuffer();
      const encryptedData = encryptFile(fileBuffer, keyHex);
      
      updateFileState({ progress: 50 });

      // Create encrypted file blob
      const encryptedBlob = new Blob([encryptedData.data]);
      
      // Upload to Firebase Storage with folder path
      const fileName = `${Date.now()}_${fileState.file.name}`;
      const selectedFolder = folders.find(f => f.id === currentFolderId);
      const folderPath = selectedFolder ? selectedFolder.path.replace(/^\//, '') : '';
      const storagePath = folderPath 
        ? `files/${currentUser.uid}/${folderPath}/${fileName}`
        : `files/${currentUser.uid}/${fileName}`;
      
      const storageRef = ref(storage, storagePath);
      
      const uploadResult = await uploadBytes(storageRef, encryptedBlob);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      
      updateFileState({ progress: 80 });

      // Save metadata to Firestore
      const fileMetadata = {
        name: fileState.file.name,
        originalName: fileState.file.name,
        size: fileState.file.size,
        type: fileState.file.type,
        encryptionKey: keyHex,
        iv: encryptedData.iv,
        uploadedBy: currentUser.uid,
        uploadedAt: serverTimestamp(),
        downloadUrl,
        storagePath,
        folderPath: selectedFolder?.path || '/',
        ...(currentFolderId && { folderId: currentFolderId }) // Only include folderId if it's not null
      };

      await addDoc(collection(db, 'files'), fileMetadata);
      
      updateFileState({ progress: 100, status: 'success' });
      toast.success(`${fileState.file.name} uploaded successfully`);

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      updateFileState({ 
        status: 'error', 
        error: errorMessage
      });
      toast.error(`Failed to upload ${fileState.file.name}`);
    }
  };

  const uploadAll = async () => {
    // Upload files sequentially to avoid overwhelming the browser
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i);
        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Folder Selection */}
      <div className="bg-white rounded-lg border shadow-sm p-4">
        <div className="flex items-center space-x-3">
          <Folder className="h-5 w-5 text-blue-500" />
          <label htmlFor="folder-select" className="text-sm font-medium text-gray-700">
            Upload to folder:
          </label>
          <select
            id="folder-select"
            value={currentFolderId || ''}
            onChange={(e) => setCurrentFolderId(e.target.value || null)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Root folder</option>
            {folders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.path}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Files will be encrypted before upload
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Files to Upload ({files.length})
            </h3>
            {files.some(f => f.status === 'pending') && (
              <button
                onClick={uploadAll}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload All
              </button>
            )}
          </div>
          
          <div className="divide-y divide-gray-200">
            {files.map((fileState, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <File className="h-8 w-8 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fileState.file.name}
                        </p>
                        {fileState.status === 'success' && (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        )}
                        {fileState.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          {formatFileSize(fileState.file.size)}
                        </p>
                        {fileState.status === 'uploading' && (
                          <span className="text-sm text-blue-600">
                            {fileState.progress}%
                          </span>
                        )}
                      </div>
                      {fileState.status === 'error' && fileState.error && (
                        <p className="text-sm text-red-600 mt-1">
                          {fileState.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {fileState.status === 'uploading' && (
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileState.progress}%` }}
                        />
                      </div>
                    )}
                    
                    {fileState.status === 'pending' && (
                      <button
                        onClick={() => uploadFile(fileState, index)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Upload
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-gray-600"
                      disabled={fileState.status === 'uploading'}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
