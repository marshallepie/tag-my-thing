import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bug, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface BugReport {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  error_message: string;
  console_logs: string | null;
  screenshot_url: string | null;
  page_url: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  status: 'new' | 'triaged' | 'in_progress' | 'resolved' | 'wont_fix';
  priority: 'low' | 'medium' | 'high' | 'critical';
  admin_notes: string | null;
}

export const BugReports: React.FC = () => {
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { isAdminInfluencer } = useAuth();

  useEffect(() => {
    if (isAdminInfluencer) {
      fetchBugReports();
    }
  }, [isAdminInfluencer]);

  useEffect(() => {
    filterReports();
  }, [bugReports, searchTerm, statusFilter, priorityFilter]);

  const fetchBugReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bug_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBugReports(data || []);
    } catch (error: any) {
      console.error('Error fetching bug reports:', error);
      toast.error('Failed to load bug reports');
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = bugReports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.page_url?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }

    setFilteredReports(filtered);
  };

  const updateBugReport = async (id: string, updates: Partial<BugReport>) => {
    setUpdateLoading(true);
    try {
      const { error } = await supabase
        .from('bug_reports')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Bug report updated successfully');
      fetchBugReports();
      setShowDetailModal(false);
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Error updating bug report:', error);
      toast.error('Failed to update bug report');
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteBugReport = async () => {
    if (!selectedReport) return;

    setDeleteLoading(true);
    try {
      const { error } = await supabase
        .from('bug_reports')
        .delete()
        .eq('id', selectedReport.id);

      if (error) throw error;

      toast.success('Bug report deleted successfully');
      fetchBugReports();
      setShowDeleteModal(false);
      setSelectedReport(null);
    } catch (error: any) {
      console.error('Error deleting bug report:', error);
      toast.error('Failed to delete bug report');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      case 'triaged':
        return <Eye className="h-4 w-4 text-primary-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-secondary-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'wont_fix':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-warning-100 text-warning-800';
      case 'triaged':
        return 'bg-primary-100 text-primary-800';
      case 'in_progress':
        return 'bg-secondary-100 text-secondary-800';
      case 'resolved':
        return 'bg-success-100 text-success-800';
      case 'wont_fix':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-error-100 text-error-800';
      case 'high':
        return 'bg-warning-100 text-warning-800';
      case 'medium':
        return 'bg-primary-100 text-primary-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = [
    {
      title: 'Total Reports',
      value: bugReports.length.toString(),
      icon: <Bug className="h-8 w-8 text-primary-600" />,
      color: 'text-primary-600'
    },
    {
      title: 'New',
      value: bugReports.filter(r => r.status === 'new').length.toString(),
      icon: <AlertTriangle className="h-8 w-8 text-warning-600" />,
      color: 'text-warning-600'
    },
    {
      title: 'In Progress',
      value: bugReports.filter(r => r.status === 'in_progress').length.toString(),
      icon: <Clock className="h-8 w-8 text-secondary-600" />,
      color: 'text-secondary-600'
    },
    {
      title: 'Resolved',
      value: bugReports.filter(r => r.status === 'resolved').length.toString(),
      icon: <CheckCircle className="h-8 w-8 text-success-600" />,
      color: 'text-success-600'
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bug reports...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Bug className="h-8 w-8 mr-3 text-error-600" />
              Bug Reports
            </h1>
            <p className="text-gray-600">
              Manage and track user-submitted bug reports
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={fetchBugReports}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {stat.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{stat.title}</h3>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Search bug reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="h-5 w-5 text-gray-400" />}
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="triaged">Triaged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="wont_fix">Won't Fix</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bug Reports List */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <Bug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bug reports found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No bug reports have been submitted yet'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="cursor-pointer" onClick={() => {
                  setSelectedReport(report);
                  setShowDetailModal(true);
                }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          <span className="ml-1 capitalize">{report.status.replace('_', ' ')}</span>
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                          <span className="capitalize">{report.priority}</span>
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {report.error_message}
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{report.user_name || report.user_email || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{format(new Date(report.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <ExternalLink className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{report.page_url || 'Unknown page'}</span>
                        </div>
                        {report.screenshot_url && (
                          <div className="flex items-center">
                            <ImageIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                            <span>Screenshot available</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                          setShowDeleteModal(true);
                        }}
                        className="text-error-600 hover:text-error-700 hover:bg-error-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bug Report Detail Modal */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
          title="Bug Report Details"
          size="xl"
        >
          {selectedReport && (
            <div className="space-y-6">
              {/* Status and Priority Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={selectedReport.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as BugReport['status'];
                      updateBugReport(selectedReport.id, { status: newStatus });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={updateLoading}
                  >
                    <option value="new">New</option>
                    <option value="triaged">Triaged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="wont_fix">Won't Fix</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedReport.priority}
                    onChange={(e) => {
                      const newPriority = e.target.value as BugReport['priority'];
                      updateBugReport(selectedReport.id, { priority: newPriority });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    disabled={updateLoading}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Screenshot */}
              {selectedReport.screenshot_url && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Screenshot</h4>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={selectedReport.screenshot_url}
                      alt="Bug report screenshot"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Error Description</h4>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedReport.error_message}</p>
                </div>
              </div>

              {/* Console Logs */}
              {selectedReport.console_logs && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Console Logs</h4>
                  <div className="bg-gray-900 text-green-400 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {selectedReport.console_logs}
                    </pre>
                  </div>
                </div>
              )}

              {/* User Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">User Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.user_name || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-900">{selectedReport.user_email || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Page URL:</span>
                    <span className="ml-2 text-gray-900 truncate">{selectedReport.page_url || 'Not provided'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <span className="ml-2 text-gray-900">{format(new Date(selectedReport.created_at), 'PPP')}</span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {selectedReport.metadata && Object.keys(selectedReport.metadata).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Technical Details</h4>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedReport.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Notes
                </label>
                <textarea
                  value={selectedReport.admin_notes || ''}
                  onChange={(e) => {
                    setSelectedReport(prev => prev ? { ...prev, admin_notes: e.target.value } : null);
                  }}
                  onBlur={() => {
                    if (selectedReport) {
                      updateBugReport(selectedReport.id, { admin_notes: selectedReport.admin_notes });
                    }
                  }}
                  placeholder="Add internal notes about this bug report..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedReport(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowDeleteModal(true);
                  }}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Report
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedReport(null);
          }}
          title="Delete Bug Report"
        >
          {selectedReport && (
            <div className="space-y-4">
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-error-700">
                    <p className="font-medium mb-1">Confirm Deletion</p>
                    <p>This action cannot be undone. The bug report and associated screenshot will be permanently deleted.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Bug Report Summary</h4>
                <p className="text-sm text-gray-700 mb-2">{selectedReport.error_message}</p>
                <p className="text-xs text-gray-500">
                  Submitted by {selectedReport.user_name || selectedReport.user_email} on{' '}
                  {format(new Date(selectedReport.created_at), 'PPP')}
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedReport(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={deleteBugReport}
                  loading={deleteLoading}
                  className="flex-1"
                >
                  Delete Report
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};