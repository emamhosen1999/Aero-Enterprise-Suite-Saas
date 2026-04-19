import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Button, Card, CardBody, CardHeader, Input, Select, SelectItem, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Pagination, Spinner, Modal, ModalContent, ModalHeader, ModalBody, Image } from "@heroui/react";
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, EllipsisVerticalIcon, CameraIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import App from '@/Layouts/App.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius';

const ProgressPhotosIndex = ({ title }) => {
    const { auth } = usePage().props;
    const { canCreate, canUpdate, canDelete, isSuperAdmin } = useHRMAC();
    
    const themeRadius = useThemeRadius();
const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth < 768);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filters, setFilters] = useState({ 
        search: '', 
        approval_status: 'all',
        chainage_from: '',
        chainage_to: ''
    });
    const [pagination, setPagination] = useState({ 
        perPage: 24, 
        currentPage: 1,
        total: 0,
        lastPage: 1
    });
    const [stats, setStats] = useState({ 
        total: 0, 
        draft: 0, 
        submitted: 0, 
        approved: 0, 
        rejected: 0
    });

    const statsData = useMemo(() => [
        { title: "Total Photos", value: stats.total, icon: <CameraIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Draft", value: stats.draft, icon: <CameraIcon className="w-6 h-6" />, color: "text-default", iconBg: "bg-default/20" },
        { title: "Submitted", value: stats.submitted, icon: <CameraIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Approved", value: stats.approved, icon: <CheckCircleIcon className="w-6 h-6" />, color: "text-success", iconBg: "bg-success/20" },
        { title: "Rejected", value: stats.rejected, icon: <XCircleIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);


    const fetchPhotos = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('rfi.progress-photos.index'), {
                params: { page: pagination.currentPage, perPage: pagination.perPage, ...filters }
            });
            
            if (response.status === 200) {
                setPhotos(response.data.data || []);
                setPagination(prev => ({ ...prev, total: response.data.total || 0, lastPage: response.data.last_page || 1 }));
                
                const data = response.data.data || [];
                setStats({
                    total: response.data.total || 0,
                    draft: data.filter(p => p.approval_status === 'draft').length,
                    submitted: data.filter(p => p.approval_status === 'submitted').length,
                    approved: data.filter(p => p.approval_status === 'approved').length,
                    rejected: data.filter(p => p.approval_status === 'rejected').length,
                });
            }
        } catch (error) {
            showToast.promise(Promise.reject(error), { error: 'Failed to fetch progress photos' });
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.currentPage, pagination.perPage]);

    useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleDelete = async (photo) => {
        if (!confirm(`Delete photo ${photo.title}?`)) return;
        
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(route('rfi.progress-photos.destroy', photo.id));
                if (response.status === 200) {
                    await fetchPhotos();
                    resolve([response.data.message || 'Photo deleted successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete photo']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting photo...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleApprove = async (photo) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(route('rfi.progress-photos.approve', photo.id));
                if (response.status === 200) {
                    await fetchPhotos();
                    resolve([response.data.message || 'Photo approved successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to approve photo']);
            }
        });

        showToast.promise(promise, {
            loading: 'Approving photo...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const statusColorMap = {
        draft: "default",
        submitted: "warning",
        approved: "success",
        rejected: "danger"
    };

    return (
        <>
            <Head title={title || "Progress Photos"} />
            
            {showModal && selectedPhoto && (
                <Modal isOpen={showModal} onOpenChange={setShowModal} size="3xl">
                    <ModalContent>
                        <ModalHeader>
                            <div className="flex flex-col">
                                <h3 className="text-lg font-semibold">{selectedPhoto.title}</h3>
                                <p className="text-sm text-default-500">
                                    Chainage {selectedPhoto.chainage_start} - {selectedPhoto.chainage_end}
                                </p>
                            </div>
                        </ModalHeader>
                        <ModalBody className="pb-6">
                            <Image src={selectedPhoto.photo_url} alt={selectedPhoto.title} className="w-full" />
                            <div className="flex flex-col gap-2 mt-4">
                                <p className="text-sm"><span className="font-semibold">Description:</span> {selectedPhoto.description || 'N/A'}</p>
                                <p className="text-sm"><span className="font-semibold">Captured:</span> {new Date(selectedPhoto.captured_at).toLocaleString()}</p>
                                <p className="text-sm"><span className="font-semibold">GPS:</span> {selectedPhoto.latitude}, {selectedPhoto.longitude}</p>
                                <Chip color={statusColorMap[selectedPhoto.approval_status]} size="sm" variant="flat">
                                    {selectedPhoto.approval_status?.toUpperCase()}
                                </Chip>
                            </div>
                        </ModalBody>
                    </ModalContent>
                </Modal>
            )}
            
            <div className="flex flex-col w-full h-full p-4" role="main">
                <div className="space-y-4">
                    <div className="w-full">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                            <Card 
                                className="transition-all duration-200"
                                style={{
                                    border: `var(--borderWidth, 2px) solid transparent`,
                                    borderRadius: `var(--borderRadius, 12px)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                    background: `linear-gradient(135deg, var(--theme-content1, #FAFAFA) 20%, var(--theme-content2, #F4F4F5) 10%, var(--theme-content3, #F1F3F4) 20%)`,
                                }}
                            >
                                <CardHeader 
                                    className="border-b p-0"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
                                    }}
                                >
                                    <div className={`${!isMobile ? 'p-6' : 'p-4'} w-full`}>
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex items-center gap-3 lg:gap-4">
                                                <div className={`${!isMobile ? 'p-3' : 'p-2'} rounded-xl`}
                                                    style={{ background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`, borderRadius: `var(--borderRadius, 12px)` }}
                                                >
                                                    <CameraIcon className={`${!isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} style={{ color: 'var(--theme-primary)' }} />
                                                </div>
                                                <div>
                                                    <h4 className={`${!isMobile ? 'text-2xl' : 'text-xl'} font-bold`}>Progress Photos</h4>
                                                    <p className={`${!isMobile ? 'text-sm' : 'text-xs'} text-default-500`}>Photo documentation with approval workflow</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-wrap">
                                                {canCreatePhoto && (
                                                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />} size={isMobile ? "sm" : "md"}>
                                                        Upload Photo
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardBody className="p-6">
                                    <StatsCards stats={statsData} className="mb-6" />
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                        <Input label="Search" placeholder="Search by title..." value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
                                            startContent={<MagnifyingGlassIcon className="w-4 h-4" />} variant="bordered" size="sm" radius={themeRadius} classNames={{ inputWrapper: "bg-default-100" }} />
                                        
                                        <Select label="Approval Status" placeholder="All Status" selectedKeys={filters.approval_status !== 'all' ? [filters.approval_status] : []}
                                            onSelectionChange={(keys) => handleFilterChange('approval_status', Array.from(keys)[0] || 'all')} variant="bordered" size="sm" radius={themeRadius} classNames={{ trigger: "bg-default-100" }}>
                                            <SelectItem key="all">All Status</SelectItem>
                                            <SelectItem key="draft">Draft</SelectItem>
                                            <SelectItem key="submitted">Submitted</SelectItem>
                                            <SelectItem key="approved">Approved</SelectItem>
                                            <SelectItem key="rejected">Rejected</SelectItem>
                                        </Select>
                                    </div>
                                    
                                    {loading ? (
                                        <div className="flex justify-center py-10"><Spinner size="lg" /></div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {photos.map((photo) => (
                                                <Card key={photo.id} isPressable onPress={() => { setSelectedPhoto(photo); setShowModal(true); }} className="overflow-hidden">
                                                    <CardBody className="p-0">
                                                        <Image src={photo.thumbnail_url || photo.photo_url} alt={photo.title} className="w-full h-48 object-cover" />
                                                        <div className="p-3">
                                                            <p className="font-semibold text-sm truncate">{photo.title}</p>
                                                            <p className="text-xs text-default-500 truncate">Ch {photo.chainage_start}-{photo.chainage_end}</p>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <Chip color={statusColorMap[photo.approval_status]} size="sm" variant="flat">
                                                                    {photo.approval_status?.toUpperCase()}
                                                                </Chip>
                                                                <Dropdown>
                                                                    <DropdownTrigger>
                                                                        <Button isIconOnly size="sm" variant="light">
                                                                            <EllipsisVerticalIcon className="w-5 h-5" />
                                                                        </Button>
                                                                    </DropdownTrigger>
                                                                    <DropdownMenu>
                                                                        {canApprovePhoto && photo.approval_status === 'submitted' && (
                                                                            <DropdownItem key="approve" startContent={<CheckCircleIcon className="w-4 h-4" />} onPress={() => handleApprove(photo)}>
                                                                                Approve
                                                                            </DropdownItem>
                                                                        )}
                                                                        {canEditPhoto && (
                                                                            <DropdownItem key="edit" startContent={<PencilIcon className="w-4 h-4" />}>Edit</DropdownItem>
                                                                        )}
                                                                        {canDeletePhoto && (
                                                                            <DropdownItem key="delete" className="text-danger" color="danger" startContent={<TrashIcon className="w-4 h-4" />} onPress={() => handleDelete(photo)}>
                                                                                Delete
                                                                            </DropdownItem>
                                                                        )}
                                                                    </DropdownMenu>
                                                                </Dropdown>
                                                            </div>
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {!loading && photos.length === 0 && (
                                        <div className="text-center py-10 text-default-500">No photos found</div>
                                    )}
                                    
                                    {pagination.lastPage > 1 && (
                                        <div className="flex justify-center mt-6">
                                            <Pagination total={pagination.lastPage} page={pagination.currentPage} onChange={(page) => setPagination(prev => ({ ...prev, currentPage: page }))} showControls color="primary" />
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </>
    );
};

ProgressPhotosIndex.layout = (page) => <App children={page} />;
export default ProgressPhotosIndex;
