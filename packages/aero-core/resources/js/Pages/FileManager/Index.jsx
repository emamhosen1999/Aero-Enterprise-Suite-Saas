import React, { useState, useEffect, useCallback } from 'react';
import { Head, usePage } from "@inertiajs/react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Skeleton,
  Breadcrumbs,
  BreadcrumbItem,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress
} from "@heroui/react";
import {
  FolderIcon,
  DocumentIcon,
  PhotoIcon,
  FilmIcon,
  MusicalNoteIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  HomeIcon,
  CloudIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';

const FileManagerIndex = () => {
  const { title } = usePage().props;
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [parentPath, setParentPath] = useState(null);
  const [stats, setStats] = useState({
    total_size: 0,
    total_size_formatted: '0 B',
    file_count: 0,
    directory_count: 0
  });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('/files/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async (path = '') => {
    setLoading(true);
    try {
      const response = await axios.get('/files/browse', {
        params: { path }
      });
      
      setFiles(response.data.data || []);
      setCurrentPath(response.data.current_path || '');
      setParentPath(response.data.parent_path);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchFiles();
  }, [fetchStats, fetchFiles]);

  const handleNavigate = (path) => {
    fetchFiles(path);
  };

  const handleGoUp = () => {
    if (parentPath !== null) {
      fetchFiles(parentPath);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath || 'uploads');

    const promise = new Promise(async (resolve, reject) => {
      try {
        await axios.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        });
        fetchFiles(currentPath);
        fetchStats();
        resolve(['File uploaded successfully']);
      } catch (error) {
        reject([error.response?.data?.message || 'Failed to upload file']);
      } finally {
        setUploading(false);
        setUploadProgress(0);
        setUploadModalOpen(false);
      }
    });

    showToast.promise(promise, {
      loading: 'Uploading file...',
      success: (data) => data.join(', '),
      error: (data) => data.join(', ')
    });
  };

  const handleDelete = async (file) => {
    const encodedPath = btoa(file.path);

    const promise = new Promise(async (resolve, reject) => {
      try {
        await axios.delete(`/files/${encodedPath}`);
        setFiles(prev => prev.filter(f => f.path !== file.path));
        fetchStats();
        resolve([`${file.type === 'directory' ? 'Folder' : 'File'} deleted`]);
      } catch (error) {
        reject([error.response?.data?.message || 'Failed to delete']);
      }
    });

    showToast.promise(promise, {
      loading: 'Deleting...',
      success: (data) => data.join(', '),
      error: (data) => data.join(', ')
    });
  };

  const getFileIcon = (file) => {
    if (file.type === 'directory') return FolderIcon;
    
    const mimeType = file.mime_type || '';
    if (mimeType.startsWith('image/')) return PhotoIcon;
    if (mimeType.startsWith('video/')) return FilmIcon;
    if (mimeType.startsWith('audio/')) return MusicalNoteIcon;
    if (mimeType.includes('text') || mimeType.includes('document')) return DocumentTextIcon;
    
    return DocumentIcon;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  // Build breadcrumb items
  const breadcrumbItems = ['Home', ...currentPath.split('/').filter(Boolean)];

  const statsData = [
    {
      title: 'Total Size',
      value: stats.total_size_formatted || '0 B',
      icon: CloudIcon,
      color: 'primary'
    },
    {
      title: 'Files',
      value: stats.file_count?.toString() || '0',
      icon: DocumentIcon,
      color: 'success'
    },
    {
      title: 'Folders',
      value: stats.directory_count?.toString() || '0',
      icon: FolderIcon,
      color: 'warning'
    }
  ];

  return (
    <App>
      <Head title={title} />
      
      <div className="space-y-6">
        {/* Stats Cards */}
        <StatsCards stats={statsData} isLoading={statsLoading} />

        {/* Main Content Card */}
        <Card className="shadow-none border border-divider">
          <CardHeader className="flex flex-col sm:flex-row justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-4">
              <FolderOpenIcon className="w-6 h-6 text-primary" />
              <Breadcrumbs>
                {breadcrumbItems.map((item, index) => (
                  <BreadcrumbItem
                    key={index}
                    onPress={() => {
                      if (index === 0) {
                        fetchFiles('');
                      } else {
                        const path = breadcrumbItems.slice(1, index + 1).join('/');
                        fetchFiles(path);
                      }
                    }}
                    isCurrent={index === breadcrumbItems.length - 1}
                  >
                    {index === 0 ? <HomeIcon className="w-4 h-4" /> : item}
                  </BreadcrumbItem>
                ))}
              </Breadcrumbs>
            </div>

            <div className="flex gap-3">
              <Button
                variant="flat"
                startContent={<ArrowPathIcon className="w-4 h-4" />}
                onPress={() => fetchFiles(currentPath)}
                isLoading={loading}
                size="sm"
              >
                Refresh
              </Button>
              <Button
                color="primary"
                startContent={<ArrowUpTrayIcon className="w-4 h-4" />}
                onPress={() => setUploadModalOpen(true)}
                size="sm"
              >
                Upload
              </Button>
            </div>
          </CardHeader>

          <CardBody className="px-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 p-4">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-default-400">
                <FolderOpenIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">This folder is empty</p>
                <p className="text-sm">Upload files to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {/* Go up item */}
                {parentPath !== null && (
                  <button
                    onClick={handleGoUp}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-divider hover:bg-default-100 transition-colors cursor-pointer"
                  >
                    <div className="p-3 rounded-lg bg-default-100">
                      <ChevronRightIcon className="w-8 h-8 text-default-500 rotate-180" />
                    </div>
                    <span className="text-sm text-default-600 truncate max-w-full">..</span>
                  </button>
                )}

                {/* Files and folders */}
                {files.map((file) => {
                  const Icon = getFileIcon(file);
                  const isFolder = file.type === 'directory';

                  return (
                    <div
                      key={file.path}
                      className="relative group flex flex-col items-center gap-2 p-4 rounded-lg border border-divider hover:bg-default-100 transition-colors"
                    >
                      <button
                        onClick={() => isFolder && handleNavigate(file.path)}
                        className={`flex flex-col items-center gap-2 w-full ${isFolder ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <div className={`p-3 rounded-lg ${isFolder ? 'bg-warning/10' : 'bg-primary/10'}`}>
                          <Icon className={`w-8 h-8 ${isFolder ? 'text-warning' : 'text-primary'}`} />
                        </div>
                        <span className="text-sm text-foreground truncate max-w-full" title={file.name}>
                          {file.name}
                        </span>
                        {!isFolder && (
                          <span className="text-xs text-default-400">
                            {formatSize(file.size)}
                          </span>
                        )}
                      </button>

                      {/* Actions dropdown */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dropdown>
                          <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                              <EllipsisVerticalIcon className="w-4 h-4" />
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="File actions">
                            {!isFolder && file.url && (
                              <DropdownItem
                                key="download"
                                as="a"
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download
                              </DropdownItem>
                            )}
                            <DropdownItem
                              key="delete"
                              color="danger"
                              className="text-danger"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              onPress={() => handleDelete(file)}
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <ModalContent>
          <ModalHeader>Upload File</ModalHeader>
          <ModalBody>
            {uploading ? (
              <div className="space-y-4">
                <p className="text-sm text-default-600">Uploading...</p>
                <Progress
                  value={uploadProgress}
                  color="primary"
                  showValueLabel
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-divider rounded-lg">
                <ArrowUpTrayIcon className="w-12 h-12 text-default-400 mb-4" />
                <p className="text-sm text-default-600 mb-4">
                  Select a file to upload
                </p>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button
                  as="label"
                  htmlFor="file-upload"
                  color="primary"
                  className="cursor-pointer"
                >
                  Choose File
                </Button>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setUploadModalOpen(false)}
              isDisabled={uploading}
            >
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </App>
  );
};

export default FileManagerIndex;
