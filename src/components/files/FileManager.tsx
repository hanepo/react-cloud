import React, { useState, useEffect, useRef } from 'react'; // Added useRef import
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp // Import Timestamp type if needed for comparison
  // Removed unused getDocs, writeBatch
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
  // Removed unused User import
  HardDrive,
  Grid3X3,
  List,
  Search,
  ArrowUp,
  Folder as FolderIcon,
  Key
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FileManagerProps {
  className?: string;
}

type ViewMode = 'list' | 'grid';
type SortField = 'name' | 'size' | 'uploadedAt' | 'type';
type SortDirection = 'asc' | 'desc';

// Define a type for the sortable values
type SortableValue = string | number | Date | Timestamp | undefined;


const FileManager: React.FC<FileManagerProps> = ({ className }) => {
  const { currentUser } = useAuth();
  const [allFiles, setAllFiles] = useState<FileMetadata[]>([]); // All user files
  const [folders, setFolders] = useState<Folder[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileMetadata[]>([]); // Files for current view
  const [loading, setLoading] = useState(true);
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showKeyPrompt, setShowKeyPrompt] = useState<FileMetadata | null>(null); // State for key prompt modal
  const [decryptionKey, setDecryptionKey] = useState(''); // State for decryption key input

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    // Listen to files owned by the user
    // Consider adding RBAC filtering here later
    const filesQuery = query(
      collection(db, 'files'),
      where('uploadedBy', '==', currentUser.uid),
      orderBy('uploadedAt', 'desc') // Initial sort by date desc
    );

    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      const fileList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
              id: doc.id,
              ...data,
              // Ensure uploadedAt is consistently a Date object or Timestamp
              uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : (data.uploadedAt ? new Date(data.uploadedAt) : new Date())
          } as FileMetadata;
      });

      setAllFiles(fileList);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching files:", error);
        toast.error("Could not load files.");
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
    const filterAndSortFiles = () => {
        // Removed unused currentFolder and currentPath variables
        // const currentFolder = getCurrentFolder();
        // const currentPath = currentFolder ? currentFolder.path + '/' : '/'; // Path needs trailing slash for prefix check

        const filtered = allFiles.filter(file => {
          // Determine if the file is directly in the selected folder or root
           const isInSelectedFolder = selectedFolderId
             ? file.folderId === selectedFolderId
             : !file.folderId; // Show root files if no folder selected

          if (!isInSelectedFolder) return false;

          // Filter by search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const nameMatch = (file.name ?? '').toLowerCase().includes(query);
            const originalNameMatch = (file.originalName ?? '').toLowerCase().includes(query);
            return nameMatch || originalNameMatch;
          }

          return true;
        });

        // Sort files
        filtered.sort((a, b) => {
          let aValue: SortableValue;
          let bValue: SortableValue;

          // Handle potential missing properties or Firestore Timestamps
          const getValue = (file: FileMetadata, field: SortField): SortableValue => {
              switch (field) {
                  case 'name': return (file.originalName || file.name || '').toLowerCase(); // Ensure string
                  case 'size': return file.size ?? 0; // Default size to 0 if missing
                  case 'uploadedAt': return file.uploadedAt; // Should be Date object now
                  case 'type': return file.type ?? ''; // Default type to empty string
                  default: return '';
              }
          };

          aValue = getValue(a, sortField);
          bValue = getValue(b, sortField);

          // Ensure values are comparable
          const valA = aValue instanceof Date ? aValue.getTime() : aValue ?? '';
          const valB = bValue instanceof Date ? bValue.getTime() : bValue ?? '';


          // Comparison logic
          let comparison = 0;
          if (valA < valB) {
              comparison = -1;
          } else if (valA > valB) {
              comparison = 1;
          }

          return sortDirection === 'asc' ? comparison : comparison * -1;
        });


        setFilteredFiles(filtered);
    };

    filterAndSortFiles();
  }, [allFiles, selectedFolderId, searchQuery, sortField, sortDirection, folders]);


  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSelectedFiles(new Set()); // Clear selection when changing folder
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // --- Download and Decryption ---
  const handleDownloadClick = (file: FileMetadata) => {
      setShowKeyPrompt(file); // Show the modal/prompt for this file
  };

  const handleDecryptionKeySubmit = async () => {
    if (!showKeyPrompt || !decryptionKey) {
        toast.error("Please enter the decryption key.");
        return;
    }
    const fileToDownload = showKeyPrompt;

    // Check if IV exists
    if (!fileToDownload.downloadUrl || !fileToDownload.iv) {
      toast.error('File metadata incomplete - cannot decrypt');
      setShowKeyPrompt(null);
      setDecryptionKey('');
      return;
    }

    setDownloadingFiles(prev => new Set(prev).add(fileToDownload.id));
    setShowKeyPrompt(null); // Close prompt

    try {
      // Fetch the encrypted file
      const response = await fetch(fileToDownload.downloadUrl);
      if (!response.ok) throw new Error(`Failed to download file (status: ${response.status})`);

      const encryptedData = await response.arrayBuffer();

      // Decrypt the file using the provided key and stored IV
      const decryptedData = decryptFile({
        data: encryptedData,
        iv: fileToDownload.iv
      }, decryptionKey); // Use the key from state

      // Create blob and trigger download
      const blob = new Blob([decryptedData], { type: fileToDownload.type });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = fileToDownload.originalName || fileToDownload.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File downloaded and decrypted successfully');
    } catch (error: any) {
      console.error('Download/Decryption error:', error);
      // Check for specific decryption errors (e.g., bad key)
      // Note: CryptoJS errors might not be very specific. 'Malformed UTF-8 data' is a common indicator.
      if (error instanceof Error && (error.message.includes('Malformed UTF-8 data') || error.message.includes('bad decrypt') || error.message.includes('invalid key') )) {
          toast.error('Decryption failed. Incorrect key?');
      } else if (error instanceof Error) {
           toast.error(`Download failed: ${error.message}`);
      } else {
           toast.error('An unknown error occurred during download/decryption.');
      }
    } finally {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileToDownload.id);
        return newSet;
      });
      setDecryptionKey(''); // Clear key input after attempt
    }
  };
   // --- End Download and Decryption ---


  const deleteFile = async (file: FileMetadata) => {
    // Confirmation dialog - replaced window.confirm
    const confirmed = await showConfirmationDialog(`Are you sure you want to delete "${file.originalName || file.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'files', file.id));

      // Delete from Storage
      if (file.storagePath) {
        const storageRef = ref(storage, file.storagePath);
        await deleteObject(storageRef);
      } else {
        console.warn(`Storage path missing for file ${file.id}, skipping storage deletion.`);
      }

      toast.success('File deleted successfully');
      setSelectedFiles(prev => { // Remove from selection if deleted
          const newSet = new Set(prev);
          newSet.delete(file.id);
          return newSet;
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete file: ${error.message}`);
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;

     const confirmed = await showConfirmationDialog(`Are you sure you want to delete ${selectedFiles.size} selected file${selectedFiles.size > 1 ? 's' : ''}? This action cannot be undone.`);
     if (!confirmed) return;

    let deletedCount = 0;
    const errors: string[] = [];
    const filesToDelete = allFiles.filter(f => selectedFiles.has(f.id)); // Get full file objects

    // Use Firestore batch write for metadata deletion for efficiency (if needed, though individual deletes might be okay)
    // For storage, parallel deletion is fine.

    const deletePromises = filesToDelete.map(async (file) => {
       try {
           // Delete from Firestore
           await deleteDoc(doc(db, 'files', file.id));

           // Delete from Storage
           if (file.storagePath) {
             const storageRef = ref(storage, file.storagePath);
             await deleteObject(storageRef);
           } else {
             console.warn(`Storage path missing for file ${file.id}, skipping storage deletion.`);
           }
           deletedCount++;
       } catch (error: any) {
           errors.push(file.originalName || file.name);
           console.error(`Failed to delete ${file.originalName || file.name}:`, error);
       }
    });


    try {
      await Promise.all(deletePromises);
      setSelectedFiles(new Set()); // Clear selection after attempting all deletes
      if (errors.length === 0) {
        toast.success(`${deletedCount} file${deletedCount > 1 ? 's' : ''} deleted successfully`);
      } else {
        toast.error(`Deleted ${deletedCount} file${deletedCount > 1 ? 's' : ''}, but failed to delete: ${errors.join(', ')}`);
      }
    } catch (error){
         console.error("Error during bulk delete operation:", error);
         toast.error('An unexpected error occurred during bulk deletion.');
    }
  };

 // --- Custom Confirmation Dialog ---
 const [showConfirmModal, setShowConfirmModal] = useState(false);
 const [confirmMessage, setConfirmMessage] = useState('');
 const confirmResolve = useRef<((value: boolean | PromiseLike<boolean>) => void) | null>(null);

 const showConfirmationDialog = (message: string): Promise<boolean> => {
   setConfirmMessage(message);
   setShowConfirmModal(true);
   return new Promise<boolean>((resolve) => {
     confirmResolve.current = resolve;
   });
 };

 const handleConfirm = (confirmed: boolean) => {
   setShowConfirmModal(false);
   if (confirmResolve.current) {
     confirmResolve.current(confirmed);
     confirmResolve.current = null; // Reset resolver
   }
 };
 // --- End Custom Confirmation Dialog ---


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

  const formatFileSize = (bytes: number | undefined) => { // Allow undefined
    if (bytes == null || isNaN(bytes) || bytes < 0) return '0 Bytes';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
    // Ensure index does not go out of bounds
    const unitIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, unitIndex)).toFixed(2)) + ' ' + sizes[unitIndex];
  };

   const formatDate = (timestamp: any): string | null => { // Return type is string or null
     if (!timestamp) return null; // Return null for invalid input

     const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);

     if (isNaN(date.getTime())) {
         console.warn("Invalid date encountered:", timestamp);
         return null; // Return null for invalid date
     }
     try {
         return date.toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'short',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
         });
      } catch (e) {
         console.error("Error formatting date:", timestamp, e);
         return null; // Return null on formatting error
      }
   };


  const getFileIcon = (type: string | undefined) => { // Allow undefined
    const iconClass = "h-8 w-8 flex-shrink-0";

    if (!type) return <File className={`${iconClass} text-gray-500`} />;

    const lowerType = type.toLowerCase(); // Use lowercase for comparison

    if (lowerType.startsWith('image/')) {
      return <Eye className={`${iconClass} text-indigo-500`} />;
    } else if (lowerType.includes('pdf')) {
      return <File className={`${iconClass} text-red-500`} />;
    } else if (lowerType.includes('document') || lowerType.includes('word')) {
      return <File className={`${iconClass} text-blue-500`} />;
    } else if (lowerType.includes('spreadsheet') || lowerType.includes('excel')) {
      return <File className={`${iconClass} text-green-600`} />;
    } else if (lowerType.startsWith('audio/')) {
        return <File className={`${iconClass} text-orange-500`} />;
    } else if (lowerType.startsWith('video/')) {
        return <File className={`${iconClass} text-purple-500`} />;
    } else if (lowerType.includes('zip') || lowerType.includes('archive')) {
        return <File className={`${iconClass} text-yellow-500`} />; // Example for archives
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
      className="flex items-center space-x-1 text-xs font-medium text-gray-500 hover:text-gray-700 focus:outline-none" // Added focus style
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
        <span className="ml-3 text-gray-600">Loading files...</span>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${className}`}>
        {/* --- Confirmation Modal --- */}
         {showConfirmModal && (
             <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
                 <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                     <div className="mt-3 text-center">
                         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                             <Trash2 className="h-6 w-6 text-red-600" aria-hidden="true"/>
                         </div>
                         <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4" id="modal-title">Confirm Deletion</h3>
                         <div className="mt-2 px-7 py-3">
                             <p className="text-sm text-gray-500">{confirmMessage}</p>
                         </div>
                         <div className="items-center px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                             <button
                                 type="button"
                                 onClick={() => handleConfirm(true)}
                                 className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                             >
                                 Yes, Delete
                             </button>
                             <button
                                 type="button"
                                 onClick={() => handleConfirm(false)}
                                 className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                             >
                                 Cancel
                             </button>
                         </div>
                     </div>
                 </div>
             </div>
         )}
        {/* --- End Confirmation Modal --- */}

        {/* --- Decryption Key Prompt Modal --- */}
         {showKeyPrompt && (
             <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center px-4">
                 <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                      <button
                        onClick={() => { setShowKeyPrompt(null); setDecryptionKey(''); }}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        aria-label="Close modal"
                      >
                         &times; {/* Simple close icon */}
                      </button>
                     <div className="mt-3 text-center">
                         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                             <Key className="h-6 w-6 text-blue-600" aria-hidden="true"/>
                         </div>
                         <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4" id="key-modal-title">Enter Decryption Key</h3>
                         <form onSubmit={(e) => { e.preventDefault(); handleDecryptionKeySubmit(); }}>
                             <div className="mt-2 px-7 py-3">
                                  <p className="text-sm text-gray-600 mb-3">
                                     Enter the key used to encrypt <span className="font-medium">{showKeyPrompt.originalName || showKeyPrompt.name}</span>:
                                  </p>
                                 <input
                                     type="password"
                                     value={decryptionKey}
                                     onChange={(e) => setDecryptionKey(e.target.value)}
                                     placeholder="Decryption Key"
                                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                     required // Make key required
                                     autoFocus
                                 />
                             </div>
                             <div className="items-center px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                 <button
                                     type="submit"
                                     disabled={!decryptionKey || downloadingFiles.has(showKeyPrompt.id)} // Disable if no key or already downloading
                                     className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                 >
                                     {downloadingFiles.has(showKeyPrompt.id) ? 'Downloading...' : 'Download & Decrypt'}
                                 </button>
                                 <button
                                     type="button"
                                     onClick={() => { setShowKeyPrompt(null); setDecryptionKey(''); }}
                                     className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                 >
                                     Cancel
                                 </button>
                             </div>
                         </form>
                     </div>
                 </div>
             </div>
         )}
         {/* --- End Decryption Key Prompt Modal --- */}


      {/* Folder Tree Sidebar */}
      <div className="lg:col-span-1">
        <FolderTree
          onFolderSelect={handleFolderSelect}
          selectedFolderId={selectedFolderId}
          showCreateFolder={currentUser?.role === 'admin' || currentUser?.role === 'editor'}
        />
      </div>

      {/* File List Main Area */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2 min-w-0">
                <FolderIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {getCurrentFolder()?.name || 'Root'}
                </h3>
                <span className="text-sm text-gray-500 flex-shrink-0">
                  ({filteredFiles.length} item{filteredFiles.length !== 1 ? 's' : ''}) {/* Correct pluralization */}
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Search */}
                <div className="relative">
                  <label htmlFor="file-search" className="sr-only">Search files</label> {/* Accessibility */}
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true"/>
                  <input
                    id="file-search"
                    type="search" // Use type search
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-48 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'} rounded-l-md`} // Rounded corners
                     aria-label="List view"
                     title="List view" // Tooltip
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 border-l border-gray-300 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'} rounded-r-md`} // Rounded corners
                     aria-label="Grid view"
                     title="Grid view" // Tooltip
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
              <div className="flex items-center justify-between mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <span className="text-sm font-medium text-blue-900">
                  {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={deleteSelectedFiles}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center" // Added flex
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </button>
                  <button
                    onClick={() => setSelectedFiles(new Set())}
                    className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Controls (Only in List View) */}
         {viewMode === 'list' && (
             <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
               <div className="flex items-center space-x-4 pl-10">
                 <SortButton field="name">Name</SortButton>
                 <SortButton field="size">Size</SortButton>
                 <SortButton field="uploadedAt">Date Modified</SortButton>
                 <SortButton field="type">Type</SortButton>
               </div>
                <input
                     type="checkbox"
                     aria-label="Select all files" // Accessibility
                     onChange={selectAllFiles}
                     checked={filteredFiles.length > 0 && selectedFiles.size === filteredFiles.length}
                     disabled={filteredFiles.length === 0}
                     className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
                     title={selectedFiles.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
                 />
             </div>
          )}
        </div>

        {/* File List / Grid */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 px-4">
              <File className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchQuery ? 'No files match your search' : 'This folder is empty'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Upload files or create a new folder.'}
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid'
                 ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4'
                 : 'divide-y divide-gray-200'}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  role="button" // Make it interactive
                  tabIndex={0} // Make it focusable
                  aria-pressed={selectedFiles.has(file.id)} // Indicate selection state
                  className={`${
                    viewMode === 'grid'
                      ? 'relative p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 transition-shadow cursor-pointer group' // Added focus-within styling
                      : 'relative px-6 py-4 hover:bg-gray-50 focus-within:bg-gray-100 flex items-center justify-between group cursor-pointer' // Added focus-within styling
                  } ${selectedFiles.has(file.id) ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400' : ''}`}
                  onClick={() => toggleFileSelection(file.id)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') toggleFileSelection(file.id); }} // Keyboard selection
                >
                  {viewMode === 'grid' ? (
                    // Grid View
                    <div className="text-center flex flex-col items-center justify-between h-full"> {/* Ensure content fills height */}
                         {/* Checkbox */}
                         <input
                           type="checkbox"
                           checked={selectedFiles.has(file.id)}
                           readOnly // Parent div handles click
                           tabIndex={-1} // Not focusable itself
                           aria-labelledby={`grid-item-name-${file.id}`} // Link to name for screen readers
                           className="absolute top-2 left-2 h-4 w-4 text-blue-600 rounded opacity-0 group-hover:opacity-100 checked:opacity-100 focus:opacity-100 transition-opacity z-10" // Make visible on focus too
                           onClick={(e) => e.stopPropagation()} // Prevent outer div click
                         />
                         {/* Icon */}
                        <div className="mb-3 mt-4"> {/* Added margin top */}
                            {getFileIcon(file.type)}
                        </div>
                         {/* Details */}
                        <div className="space-y-1 w-full flex-grow flex flex-col justify-center"> {/* Center content vertically */}
                           <div className="flex items-center justify-center space-x-1">
                              <Lock className="h-3 w-3 text-blue-500 flex-shrink-0" aria-label="Encrypted"/>
                               <p id={`grid-item-name-${file.id}`} className="text-sm font-medium text-gray-900 truncate" title={file.originalName || file.name}>
                                {file.originalName || file.name}
                              </p>
                          </div>
                            <p className="text-xs text-gray-500">
                             {formatFileSize(file.size)}
                            </p>
                           <p className="text-xs text-gray-500" title={formatDate(file.uploadedAt) ?? undefined}>
                             {formatDate(file.uploadedAt)?.split(',')[0] ?? 'No date'}
                           </p>
                        </div>
                         {/* Actions (visible on hover/focus-within) */}
                        <div className="absolute bottom-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDownloadClick(file); }}
                                disabled={downloadingFiles.has(file.id)}
                                className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                                title="Download"
                                aria-label={`Download ${file.originalName || file.name}`}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            {(currentUser?.uid === file.uploadedBy || currentUser?.role === 'admin') && (
                               <button
                                  onClick={(e) => { e.stopPropagation(); deleteFile(file); }}
                                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                                  title="Delete"
                                  aria-label={`Delete ${file.originalName || file.name}`}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </button>
                            )}
                        </div>
                         {/* Downloading Indicator */}
                         {downloadingFiles.has(file.id) && (
                           <div className="absolute bottom-1 left-1 right-1 px-1">
                             <div role="progressbar" aria-valuenow={33} aria-valuemin={0} aria-valuemax={100} className="bg-gray-200 rounded-full h-1 w-full overflow-hidden">
                               <div className="bg-blue-600 h-1 rounded-full animate-pulse w-1/3"></div>
                             </div>
                           </div>
                         )}
                    </div>
                  ) : (
                    // List View
                    <>
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          readOnly // Parent div handles click
                          tabIndex={-1} // Not focusable itself
                          aria-labelledby={`list-item-name-${file.id}`} // Link to name for screen readers
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                           onClick={(e) => e.stopPropagation()} // Prevent outer div click
                        />

                        {getFileIcon(file.type)}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p id={`list-item-name-${file.id}`} className="text-sm font-medium text-gray-900 truncate">
                              {file.originalName || file.name}
                            </p>
                            <Lock className="h-3 w-3 text-blue-500 flex-shrink-0" aria-label="Encrypted"/>
                          </div>

                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 flex-wrap">
                            <div className="flex items-center space-x-1 flex-shrink-0" title="File size">
                              <HardDrive className="h-3 w-3" />
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                            <div className="flex items-center space-x-1 flex-shrink-0" title="Date modified">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(file.uploadedAt) ?? 'No date'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions (visible on hover/focus-within) */}
                      <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex-shrink-0">
                        <button
                           onClick={(e) => { e.stopPropagation(); handleDownloadClick(file); }}
                          disabled={downloadingFiles.has(file.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                          title="Download file"
                           aria-label={`Download ${file.originalName || file.name}`}
                        >
                          <Download className="h-4 w-4" />
                        </button>

                         {(currentUser?.uid === file.uploadedBy || currentUser?.role === 'admin') && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteFile(file); }}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-red-500"
                              title="Delete file"
                               aria-label={`Delete ${file.originalName || file.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                         )}
                      </div>

                      {/* Downloading Indicator */}
                      {downloadingFiles.has(file.id) && (
                        <div className="ml-4 flex-shrink-0 absolute right-20 top-1/2 transform -translate-y-1/2"> {/* Position indicator */}
                          <div className="flex items-center space-x-2">
                             <div role="progressbar" aria-valuenow={33} aria-valuemin={0} aria-valuemax={100} className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-1/3"></div>
                            </div>
                            {/* <span className="text-xs text-gray-500">Downloading...</span> */}
                          </div>
                        </div>
                      )}
                    </>
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

