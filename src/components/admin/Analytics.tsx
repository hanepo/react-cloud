import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  Files,
  HardDrive,
  Activity,
  Download,
  Upload,
  Shield
} from 'lucide-react';
import { formatBytes } from '../../utils/storageQuota';
import type { SystemStats } from '../../types';

const Analytics: React.FC = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    activeUsers24h: 0,
    uploadsToday: 0,
    downloadsToday: 0,
    avgFileSize: 0,
    topFileTypes: []
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadAnalytics();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;

      // Get total files and storage
      const filesSnapshot = await getDocs(collection(db, 'files'));
      let totalFiles = filesSnapshot.size;
      let totalStorage = 0;
      const fileTypeCounts: Record<string, number> = {};

      filesSnapshot.forEach(doc => {
        const data = doc.data();
        totalStorage += data.size || 0;

        // Count file types
        const type = data.type || 'unknown';
        fileTypeCounts[type] = (fileTypeCounts[type] || 0) + 1;
      });

      const avgFileSize = totalFiles > 0 ? totalStorage / totalFiles : 0;

      // Get top 5 file types
      const topFileTypes = Object.entries(fileTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get activity from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const activityQuery = query(
        collection(db, 'activityLogs'),
        where('timestamp', '>=', Timestamp.fromDate(yesterday))
      );
      const activitySnapshot = await getDocs(activityQuery);

      let activeUsers = new Set<string>();
      let uploadsToday = 0;
      let downloadsToday = 0;
      const recentActivities: any[] = [];

      activitySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.userId) {
          activeUsers.add(data.userId);
        }

        if (data.action === 'file_upload') uploadsToday++;
        if (data.action === 'file_download') downloadsToday++;

        // Keep last 10 activities sorted by timestamp
        recentActivities.push({ id: doc.id, ...data });
      });

      // Sort by timestamp descending and take top 10
      recentActivities.sort((a, b) => {
        const aTime = a.timestamp?.toMillis?.() || 0;
        const bTime = b.timestamp?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setStats({
        totalUsers,
        totalFiles,
        totalStorage,
        activeUsers24h: activeUsers.size,
        uploadsToday,
        downloadsToday,
        avgFileSize,
        topFileTypes
      });

      setRecentActivity(recentActivities.slice(0, 10));
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | number;
    trend?: string;
    color: string;
  }> = ({ icon, label, value, trend, color }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        {trend && (
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );

  if (currentUser?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to view analytics.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="h-6 w-6 text-blue-600" />}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-blue-50"
        />
        <StatCard
          icon={<Files className="h-6 w-6 text-green-600" />}
          label="Total Files"
          value={stats.totalFiles}
          color="bg-green-50"
        />
        <StatCard
          icon={<HardDrive className="h-6 w-6 text-purple-600" />}
          label="Storage Used"
          value={formatBytes(stats.totalStorage)}
          color="bg-purple-50"
        />
        <StatCard
          icon={<Activity className="h-6 w-6 text-orange-600" />}
          label="Active Users (24h)"
          value={stats.activeUsers24h}
          color="bg-orange-50"
        />
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <Upload className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.uploadsToday}</div>
              <div className="text-sm text-gray-500">Uploads Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <Download className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.downloadsToday}</div>
              <div className="text-sm text-gray-500">Downloads Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{formatBytes(stats.avgFileSize)}</div>
              <div className="text-sm text-gray-500">Avg File Size</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top File Types */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Top File Types</h3>
        </div>
        <div className="p-6">
          {stats.topFileTypes.length === 0 ? (
            <p className="text-sm text-gray-500">No files uploaded yet</p>
          ) : (
            <div className="space-y-4">
              {stats.topFileTypes.map((item, index) => {
                const percentage = (item.count / stats.totalFiles) * 100;
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {item.type.split('/')[0].toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        {item.count} files ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y">
          {recentActivity.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No recent activity
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.userEmail}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.action.replace(/_/g, ' ').toUpperCase()}
                      {activity.resourceName && ` - ${activity.resourceName}`}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400 ml-4">
                    {activity.timestamp?.toDate?.()?.toLocaleString() || 'Just now'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
