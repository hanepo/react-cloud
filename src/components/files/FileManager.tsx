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
import type { FileMetadata, Folder } from '../../types';
import FolderTree from './FolderTree';
import { 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Lock,
  Calendar,
  User,
  HardDrive,
  Grid3X3,
  List,
  Search,
  ArrowUp,
  Folder as FolderIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FileManagerProps {
  className?: string;
}

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'size' | 'uploadedAt' | 'type';
type SortDirection = 'asc' | 'desc';

const FileManager: React.FC<FileManagerProps> = ({ className }) => {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser) return;

    // Listen to files
    const filesQuery = query(
      collection(db, 'files'),
      where('uploadedBy', '==', currentUser.uid),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      const fileList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FileMetadata[];
      
      setFiles(fileList);
      setLoading(false);
    });

    // Listen to folders
    const foldersQuery = query(
      collection(db, 'folders'),
      where('createdBy', '==', currentUser.uid),
      orderBy('name', 'asc')
    );

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
      const folderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Folder[];
      
      setFolders(folderList);
    });

    return () => {
      unsubscribeFiles();
      unsubscribeFolders();
    };
  }, [currentUser]);

  // Filter and sort files when dependencies change
  useEffect(() => {
    const filtered = files.filter(file => {
      // Filter by current folder
      const inCorrectFolder = selectedFolderId 
        ? file.folderId === selectedFolderId 
        : !file.folderId;
      
      if (!inCorrectFolder) return false;

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return file.name.toLowerCase().includes(query) ||
               (file.originalName?.toLowerCase().includes(query));
      }

      return true;
    });

    // Sort files
    filtered.sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;
      
      switch (sortField) {
        case 'name':
          aValue = (a.originalName || a.name).toLowerCase();
          bValue = (b.originalName || b.name).toLowerCase();
          break;
        case 'size':
          aValue = a.size;
          bValue = b.size;
          break;
        case 'uploadedAt':
          aValue = a.uploadedAt;
          bValue = b.uploadedAt;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredFiles(filtered);
  }, [files, selectedFolderId, searchQuery, sortField, sortDirection]);

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedFiles(new Set());
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const downloadFile = async (file: FileMetadata) => {
    if (!file.downloadUrl || !file.encryptionKey || !file.iv) {
      toast.error('File cannot be downloaded - missing encryption data');
      return;
    }

    setDownloadingFiles(prev => new Set(prev).add(file.id));

    try {
      const response = await fetch(file.downloadUrl);
      if (!response.ok) throw new Error('Failed to download file');
      
      const encryptedData = await response.arrayBuffer();
      
      const decryptedData = decryptFile({
        data: encryptedData,
        iv: file.iv
      }, file.encryptionKey);

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
    } catch (error) {
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
      await deleteDoc(doc(db, 'files', file.id));
      
      if (file.storagePath) {
        const storageRef = ref(storage, file.storagePath);
        await deleteObject(storageRef);
      }

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedFiles.size} selected files?`)) {
      return;
    }

    const promises = Array.from(selectedFiles).map(fileId => {
      const file = files.find(f => f.id === fileId);
      if (file) return deleteFile(file);
      return Promise.resolve();
    });

    try {
      await Promise.all(promises);
      setSelectedFiles(new Set());
      toast.success(`${selectedFiles.size} files deleted successfully`);
    } catch {
      toast.error('Some files could not be deleted');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: Date | { toDate(): Date } | string | number) => {
    if (!timestamp) return 'Unknown';
    const date = typeof timestamp === 'object' && 'toDate' in timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp);
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

  const getCurrentFolder = () => {
    if (!selectedFolderId) return null;
    return folders.find(f => f.id === selectedFolderId);
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-gray-700"
    >
      <span>{children}</span>
      {sortField === field && (
        <ArrowUp className={`h-3 w-3 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
      {/* Folder Tree Sidebar */}
      <div className="lg:col-span-1">
        <FolderTree
          onFolderSelect={handleFolderSelect}
          selectedFolderId={selectedFolderId}
          showCreateFolder={true}
        />
      </div>

      {/* File List Main Area */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FolderIcon className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  {getCurrentFolder()?.name || 'Root'}
                </h3>
                <span className="text-sm text-gray-500">
                  ({filteredFiles.length} files)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
              <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-md">
                <span className="text-sm font-medium text-blue-900">
                  {selectedFiles.size} files selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={deleteSelectedFiles}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedFiles(new Set())}
                    className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SortButton field="name">Name</SortButton>
                <SortButton field="size">Size</SortButton>
                <SortButton field="uploadedAt">Date</SortButton>
                <SortButton field="type">Type</SortButton>
              </div>
              
              <button
                onClick={selectAllFiles}
                className="text-xs text-blue-600 hover:text-blue-500"
              >
                {selectedFiles.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="bg-white rounded-lg border shadow-sm">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'No files found' : 'No files in this folder'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Upload files to get started'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4' : 'divide-y divide-gray-200'}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={`${
                    viewMode === 'grid'
                      ? 'p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'
                      : 'px-6 py-4 hover:bg-gray-50'
                  } ${selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        {getFileIcon(file.type)}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            className="h-3 w-3 text-blue-600 rounded"
                          />
                          <Lock className="h-3 w-3 text-blue-500" />
                        </div>
                        
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.originalName || file.name}>
                          {file.originalName || file.name}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        
                        <p className="text-xs text-gray-500">
                          {formatDate(file.uploadedAt)}
                        </p>
                      </div>

                      <div className="flex justify-center space-x-1 mt-3">
                        <button
                          onClick={() => downloadFile(file)}
                          disabled={downloadingFiles.has(file.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteFile(file)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {downloadingFiles.has(file.id) && (
                        <div className="mt-2">
                          <div className="bg-gray-200 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full animate-pulse w-1/3"></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">Downloading...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    // List View
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        
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

                      {downloadingFiles.has(file.id) && (
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-1/3"></div>
                            </div>
                            <span className="text-xs text-gray-500">Downloading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileManager;
