import React, { useState, useEffect } from 'react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Chip,
    Spinner,
    Tooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Divider,
} from '@heroui/react';
import {
    EnvelopeIcon,
    ArrowPathIcon,
    TrashIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    BriefcaseIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showToast } from '@/utils/toastUtils';
import { formatDistanceToNow } from 'date-fns';

/**
 * PendingInvitationsPanel
 * 
 * Displays and manages pending team invitations
 * Allows resending and canceling invitations
 */
const PendingInvitationsPanel = ({ onInvitationChange }) => {
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, invitation: null });
    const [themeRadius, setThemeRadius] = useState('lg');

    // Theme utility
    const getThemeRadius = () => {
        if (typeof window === 'undefined') return 'lg';
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 16) return 'lg';
        return 'full';
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setThemeRadius(getThemeRadius());
        }
    }, []);

    // Fetch pending invitations
    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('users.invitations.pending'));
            setInvitations(response.data.invitations || []);
        } catch (error) {
            console.error('Error fetching invitations:', error);
            showToast.error('Failed to load invitations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    // Resend invitation
    const handleResend = async (invitation) => {
        setActionLoading(`resend-${invitation.id}`);
        try {
            const response = await axios.post(
                route('users.invitations.resend', { invitation: invitation.id })
            );
            showToast.success(`Invitation resent to ${invitation.email}`);
            fetchInvitations();
            onInvitationChange?.();
        } catch (error) {
            console.error('Error resending invitation:', error);
            showToast.error(error.response?.data?.message || 'Failed to resend invitation');
        } finally {
            setActionLoading(null);
        }
    };

    // Cancel invitation
    const handleCancel = async () => {
        if (!deleteModal.invitation) return;

        setActionLoading(`cancel-${deleteModal.invitation.id}`);
        try {
            await axios.delete(
                route('users.invitations.cancel', { invitation: deleteModal.invitation.id })
            );
            showToast.success(`Invitation to ${deleteModal.invitation.email} cancelled`);
            setDeleteModal({ open: false, invitation: null });
            fetchInvitations();
            onInvitationChange?.();
        } catch (error) {
            console.error('Error canceling invitation:', error);
            showToast.error('Failed to cancel invitation');
        } finally {
            setActionLoading(null);
        }
    };

    // Get status color
    const getStatusColor = (invitation) => {
        const expiresAt = new Date(invitation.expires_at);
        const now = new Date();
        const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);

        if (daysUntilExpiry < 1) return 'danger';
        if (daysUntilExpiry < 3) return 'warning';
        return 'success';
    };

    // Format date
    const formatDate = (dateString) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <Card
                className="w-full"
                style={{
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <CardBody className="flex items-center justify-center p-8">
                    <Spinner size="lg" />
                    <p className="text-default-500 mt-4">Loading invitations...</p>
                </CardBody>
            </Card>
        );
    }

    if (invitations.length === 0) {
        return (
            <Card
                className="w-full"
                style={{
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `color-mix(in srgb, var(--theme-content1) 50%, transparent)`,
                }}
            >
                <CardBody className="flex flex-col items-center justify-center p-8 text-center">
                    <div
                        className="p-4 rounded-full mb-4"
                        style={{
                            background: `color-mix(in srgb, var(--theme-default-200) 30%, transparent)`,
                        }}
                    >
                        <EnvelopeIcon className="w-8 h-8 text-default-400" />
                    </div>
                    <p className="text-default-700 font-medium mb-1">No Pending Invitations</p>
                    <p className="text-default-500 text-sm">
                        All invitations have been accepted or expired
                    </p>
                </CardBody>
            </Card>
        );
    }

    return (
        <>
            <Card
                className="w-full"
                style={{
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}
            >
                <CardHeader className="flex justify-between items-center px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-lg"
                            style={{
                                background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                            }}
                        >
                            <EnvelopeIcon
                                className="w-5 h-5"
                                style={{ color: 'var(--theme-primary)' }}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-foreground">
                                Pending Invitations
                            </h3>
                            <p className="text-sm text-default-500">
                                {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} awaiting acceptance
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="flat"
                        startContent={<ArrowPathIcon className="w-4 h-4" />}
                        onPress={fetchInvitations}
                        radius={themeRadius}
                        isLoading={loading}
                    >
                        Refresh
                    </Button>
                </CardHeader>

                <Divider />

                <CardBody className="p-0">
                    <div className="divide-y divide-divider">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="p-4 hover:bg-default-50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    {/* Left: Invitation Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h4 className="font-semibold text-foreground truncate">
                                                {invitation.email}
                                            </h4>
                                            <Chip
                                                size="sm"
                                                variant="flat"
                                                color={getStatusColor(invitation)}
                                                startContent={<ClockIcon className="w-3 h-3" />}
                                            >
                                                Expires {formatDate(invitation.expires_at)}
                                            </Chip>
                                        </div>

                                        <div className="flex flex-wrap gap-3 text-sm text-default-600">
                                            {/* Role */}
                                            <div className="flex items-center gap-1">
                                                <UserGroupIcon className="w-4 h-4 text-default-400" />
                                                <span className="capitalize">
                                                    {invitation.role?.replace(/-/g, ' ')}
                                                </span>
                                            </div>

                                            {/* Department */}
                                            {invitation.metadata?.department_id && (
                                                <div className="flex items-center gap-1">
                                                    <BuildingOfficeIcon className="w-4 h-4 text-default-400" />
                                                    <span>Department assigned</span>
                                                </div>
                                            )}

                                            {/* Designation */}
                                            {invitation.metadata?.designation_id && (
                                                <div className="flex items-center gap-1">
                                                    <BriefcaseIcon className="w-4 h-4 text-default-400" />
                                                    <span>Designation assigned</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-2 text-xs text-default-500">
                                            <span>Sent {formatDate(invitation.created_at)}</span>
                                            {invitation.inviter && (
                                                <>
                                                    <span>•</span>
                                                    <span>by {invitation.inviter.name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2">
                                        <Tooltip content="Resend invitation email">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="primary"
                                                isIconOnly
                                                onPress={() => handleResend(invitation)}
                                                isLoading={actionLoading === `resend-${invitation.id}`}
                                                radius={themeRadius}
                                            >
                                                <ArrowPathIcon className="w-4 h-4" />
                                            </Button>
                                        </Tooltip>

                                        <Tooltip content="Cancel invitation" color="danger">
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                isIconOnly
                                                onPress={() =>
                                                    setDeleteModal({ open: true, invitation })
                                                }
                                                isLoading={actionLoading === `cancel-${invitation.id}`}
                                                radius={themeRadius}
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, invitation: null })}
                size="sm"
                backdrop="blur"
                radius={themeRadius}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="w-5 h-5 text-danger" />
                            <span>Cancel Invitation</span>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-default-600">
                            Are you sure you want to cancel the invitation to{' '}
                            <strong>{deleteModal.invitation?.email}</strong>?
                        </p>
                        <p className="text-sm text-default-500 mt-2">
                            The invitation link will no longer work, and they won't be able to
                            join your organization using this invitation.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            onPress={() => setDeleteModal({ open: false, invitation: null })}
                            radius={themeRadius}
                        >
                            Keep Invitation
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleCancel}
                            isLoading={actionLoading !== null}
                            radius={themeRadius}
                        >
                            Cancel Invitation
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default PendingInvitationsPanel;
