import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { AccessRequest } from '../../types';
import { 
  MessageSquare, 
  Check, 
  X, 
  Clock,
  File,
  User,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const AccessRequestManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.role !== 'admin') return;

    const requestsQuery = query(
      collection(db, 'accessRequests'),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requestList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccessRequest[];
      
      setAccessRequests(requestList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleRequest = async (request: AccessRequest, action: 'approve' | 'deny') => {
    if (!currentUser) return;

    try {
      // Update the access request status
      await updateDoc(doc(db, 'accessRequests', request.id), {
        status: action === 'approve' ? 'approved' : 'denied',
        respondedBy: currentUser.uid,
        respondedAt: new Date()
      });

      // If approved, also update the file permissions
      if (action === 'approve') {
        const fileRef = doc(db, 'files', request.fileId);
        await updateDoc(fileRef, {
          allowedUsers: arrayUnion(request.requestedBy)
        });
      }

      toast.success(`Access request ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${action}ing access request:`, error);
      toast.error(`Failed to ${action} access request`);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only admins can manage access requests.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingRequests = accessRequests.filter(req => req.status === 'pending');
  const processedRequests = accessRequests.filter(req => req.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div className="bg-white shadow-sm rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Pending Access Requests ({pendingRequests.length})
          </h3>
        </div>
        
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              All access requests have been processed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {pendingRequests.map((request) => (
              <div key={request.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.fileName}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{request.requestedByEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(request.requestedAt)}</span>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleRequest(request, 'approve')}
                      className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRequest(request, 'deny')}
                      className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Processed Requests ({processedRequests.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {processedRequests.map((request) => (
              <div key={request.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <File className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.fileName}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{request.requestedByEmail}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(request.respondedAt || request.requestedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
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

export default AccessRequestManagement;