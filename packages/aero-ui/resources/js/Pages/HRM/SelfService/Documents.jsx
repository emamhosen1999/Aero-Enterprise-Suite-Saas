import React, { useEffect, useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Chip, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Textarea,
} from "@heroui/react";
import {
    DocumentTextIcon, ArrowDownTrayIcon, FolderIcon, DocumentIcon,
    PlusIcon, ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/ui/toastUtils';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/UI/StatsCards';
import { useHRMAC } from '@/Hooks/access/useHRMAC';
import { useThemeRadius } from '@/Hooks/theme/useThemeRadius';

const DOC_TYPES = ['Passport', 'ID', 'Visa', 'Certificate', 'Other'];
const EMPTY_FORM = { document_name: '', document_type: '', notes: '' };

const isExpiringSoon = (expiry_date) => {
    if (!expiry_date) return false;
    const today = new Date();
    const expiry = new Date(expiry_date);
    const diffDays = (expiry - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 30;
};

const isExpired = (expiry_date) => {
    if (!expiry_date) return false;
    return new Date(expiry_date) < new Date();
};

const Documents = ({ title, documents = [] }) => {
    const themeRadius = useThemeRadius();
    const { canCreate, isSuperAdmin } = useHRMAC();
    const canRequest = canCreate('hrm.self-service.documents') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const handleRequestUpload = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/hrm/self-service/documents/request', form);
                if (response.status === 200 || response.status === 201) {
                    resolve([response.data.message || 'Document upload request submitted']);
                    setModalOpen(false);
                    setForm(EMPTY_FORM);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    reject('This feature is not yet available. Please contact HR to upload documents.');
                } else {
                    reject(error.response?.data?.message || 'Failed to submit request');
                }
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: 'Submitting document upload request...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const stats = useMemo(() => {
        const expiringSoon = documents.filter(d => isExpiringSoon(d.expiry_date)).length;
        const expired = documents.filter(d => isExpired(d.expiry_date)).length;
        return { total: documents.length, expiringSoon, expired };
    }, [documents]);

    const statsData = useMemo(() => [
        { title: "Total Documents", value: stats.total, icon: <FolderIcon className="w-6 h-6" />, color: "text-primary", iconBg: "bg-primary/20" },
        { title: "Expiring Soon", value: stats.expiringSoon, icon: <ExclamationTriangleIcon className="w-6 h-6" />, color: "text-warning", iconBg: "bg-warning/20" },
        { title: "Expired", value: stats.expired, icon: <DocumentIcon className="w-6 h-6" />, color: "text-danger", iconBg: "bg-danger/20" },
    ], [stats]);

    const getDocumentStatus = (doc) => {
        if (isExpired(doc.expiry_date)) return 'expired';
        if (isExpiringSoon(doc.expiry_date)) return 'expiring_soon';
        return doc.status || 'active';
    };

    const statusColorMap = {
        active: 'success',
        expired: 'danger',
        expiring_soon: 'warning',
    };

    const columns = [
        { uid: 'name', name: 'Name' },
        { uid: 'type', name: 'Type' },
        { uid: 'status', name: 'Status' },
        { uid: 'expiry_date', name: 'Expiry Date' },
        { uid: 'uploaded_date', name: 'Uploaded Date' },
        { uid: 'actions', name: 'Actions' },
    ];

    const renderCell = (item, columnKey) => {
        switch (columnKey) {
            case 'status': {
                const docStatus = getDocumentStatus(item);
                return (
                    <Chip color={statusColorMap[docStatus] || 'default'} size="sm" variant="flat">
                        {docStatus.replace('_', ' ')}
                    </Chip>
                );
            }
            case 'expiry_date':
                return item.expiry_date ? (
                    <span className={
                        isExpired(item.expiry_date) ? 'text-danger font-medium' :
                        isExpiringSoon(item.expiry_date) ? 'text-warning font-medium' : ''
                    }>
                        {item.expiry_date}
                    </span>
                ) : '—';
            case 'uploaded_date':
                return item.uploaded_date || '-';
            case 'actions':
                return (
                    <Button size="sm" variant="flat" color="primary"
                        startContent={<ArrowDownTrayIcon className="w-4 h-4" />}>
                        Download
                    </Button>
                );
            default:
                return item[columnKey] || '-';
        }
    };

    return (
        <>
            <Head title={title || 'My Documents'} />

            {modalOpen && (
                <Modal isOpen scrollBehavior="inside" size="lg"
                    onOpenChange={(open) => { setModalOpen(open); if (!open) setForm(EMPTY_FORM); }}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Request Document Upload</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <Input label="Document Name" placeholder="Enter document name" isRequired radius={themeRadius}
                                value={form.document_name}
                                onValueChange={(v) => setForm(p => ({ ...p, document_name: v }))} />
                            <Select label="Document Type" placeholder="Select document type" isRequired radius={themeRadius}
                                selectedKeys={form.document_type ? [form.document_type] : []}
                                onSelectionChange={(keys) => setForm(p => ({ ...p, document_type: Array.from(keys)[0] || '' }))}>
                                {DOC_TYPES.map(t => <SelectItem key={t}>{t}</SelectItem>)}
                            </Select>
                            <Textarea label="Notes" placeholder="Any additional notes" radius={themeRadius} minRows={3}
                                value={form.notes} onValueChange={(v) => setForm(p => ({ ...p, notes: v }))} />
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => { setModalOpen(false); setForm(EMPTY_FORM); }}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={handleRequestUpload}>Submit Request</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title="My Documents"
                subtitle="Access your employment documents"
                icon={<DocumentTextIcon className="w-6 h-6" />}
                iconColorClass="text-primary"
                iconBgClass="bg-primary/20"
                stats={<StatsCards stats={statsData} />}
                actions={canRequest && (
                    <Button color="primary" variant="shadow" startContent={<PlusIcon className="w-4 h-4" />}
                        size={isMobile ? 'sm' : 'md'} onPress={() => setModalOpen(true)}>
                        Request Document Upload
                    </Button>
                )}
                ariaLabel="My Documents"
            >
                {documents.length > 0 ? (
                    <Table aria-label="Documents" classNames={{
                        wrapper: "shadow-none border border-divider rounded-lg",
                        th: "bg-default-100 text-default-600 font-semibold",
                        td: "py-3"
                    }}>
                        <TableHeader columns={columns}>
                            {(column) => <TableColumn key={column.uid}>{column.name}</TableColumn>}
                        </TableHeader>
                        <TableBody items={documents}>
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12 text-default-500">
                        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium">No Documents Available</p>
                        <p className="text-sm">Your employment documents will appear here.</p>
                    </div>
                )}
            </StandardPageLayout>
        </>
    );
};

Documents.layout = (page) => <App children={page} />;
export default Documents;
