import React, { useState } from 'react';
import { Card, CardBody, Chip, Button } from '@heroui/react';
import { MegaphoneIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useHRMAC } from '@/Hooks/useHRMAC';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import CreateAnnouncementModal from './CreateAnnouncementModal';

const typeColorMap = {
    info: 'primary',
    warning: 'warning',
    danger: 'danger',
    success: 'success',
};

const AnnouncementsBanner = ({ announcements = [], onRefresh }) => {
    const { hasAccess } = useHRMAC();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [dismissed, setDismissed] = useState([]);

    const canCreate = hasAccess('core.dashboard.announcements.create');

    const handleDismiss = async (id) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                await axios.post(route('core.dashboard.announcements.dismiss', { announcement: id }));
                setDismissed(prev => [...prev, id]);
                resolve(['Announcement dismissed']);
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to dismiss']);
            }
        });

        showToast.promise(promise, {
            loading: 'Dismissing...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const visibleAnnouncements = announcements.filter(a => !dismissed.includes(a.id));
    if (visibleAnnouncements.length === 0 && !canCreate) return null;

    return (
        <>
            {showCreateModal && (
                <CreateAnnouncementModal
                    open={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={onRefresh}
                />
            )}

            <div className="space-y-2">
                {canCreate && visibleAnnouncements.length === 0 && (
                    <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => setShowCreateModal(true)}
                    >
                        Create Announcement
                    </Button>
                )}

                {visibleAnnouncements.map((announcement) => (
                    <Card
                        key={announcement.id}
                        className={`border-l-4`}
                        style={{ borderLeftColor: `var(--heroui-${typeColorMap[announcement.type] || 'primary'})` }}
                    >
                        <CardBody className="p-3 flex flex-row items-start gap-3">
                            <MegaphoneIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: `var(--heroui-${typeColorMap[announcement.type] || 'primary'})` }} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold text-sm">{announcement.title}</span>
                                    {announcement.isPinned && <Chip size="sm" color="warning" variant="flat">Pinned</Chip>}
                                    <Chip size="sm" color={typeColorMap[announcement.type]} variant="flat">{announcement.type}</Chip>
                                </div>
                                <p className="text-xs text-default-500 line-clamp-2">{announcement.body}</p>
                            </div>
                            {announcement.isDismissible && (
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleDismiss(announcement.id)}
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </Button>
                            )}
                        </CardBody>
                    </Card>
                ))}

                {canCreate && visibleAnnouncements.length > 0 && (
                    <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={() => setShowCreateModal(true)}
                    >
                        New Announcement
                    </Button>
                )}
            </div>
        </>
    );
};

export default AnnouncementsBanner;
