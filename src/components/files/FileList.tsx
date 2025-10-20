import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { decryptFile } from '../../utils/encryption';
import type { FileMetadata } from '../../types';
import { 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Lock,
  Calendar,
  User,
  HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';

const FileList: React.FC = () => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;

    const filesQuery = query(
      collection(db, 'files'),
      where('uploadedBy', '==', currentUser.uid),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(filesQuery, (snapshot) => {
      const fileList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FileMetadata[];
      
      setFiles(fileList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const downloadFile = async (file: FileMetadata) => {
    if (!file.downloadUrl || !file.encryptionKey || !file.iv) {
      toast.error('File cannot be downloaded - missing encryption data');
      return;
    }

    setDownloadingFiles(prev => new Set(prev).add(file.id));

    try {
      // Fetch the encrypted file
      const response = await fetch(file.downloadUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const encryptedData = await response.arrayBuffer();
      
      // Decrypt the file
      const decryptedData = decryptFile({
        data: encryptedData,
        iv: file.iv
      }, file.encryptionKey);

      // Create blob and download
      const blob = new Blob([decryptedData], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName || file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const deleteFile = async (file: FileMetadata) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'files', file.id));
      
      // Delete from Storage
      if (file.storagePath) {
        const storageRef = ref(storage, file.storagePath);
        await deleteObject(storageRef);
      }

      toast.success('File deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type: string) => {
    const iconClass = "h-8 w-8";
    
    if (type.startsWith('image/')) {
      return <Eye className={`${iconClass} text-green-500`} />;
    } else if (type.includes('pdf')) {
      return <File className={`${iconClass} text-red-500`} />;
    } else if (type.includes('document') || type.includes('word')) {
      return <File className={`${iconClass} text-blue-500`} />;
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return <File className={`${iconClass} text-green-600`} />;
    } else {
      return <File className={`${iconClass} text-gray-500`} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <File className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by uploading a file.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Your Files ({files.length})
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {files.map((file) => (
          <div key={file.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {getFileIcon(file.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName || file.name}
                    </p>
                    <Lock className="h-3 w-3 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="h-3 w-3" />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(file.uploadedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>You</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => downloadFile(file)}
                  disabled={downloadingFiles.has(file.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => deleteFile(file)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {downloadingFiles.has(file.id) && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-1/3"></div>
                  </div>
                  <span className="text-xs text-gray-500">Downloading...</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
