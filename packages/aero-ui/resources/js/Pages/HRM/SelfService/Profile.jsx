import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
    Select, SelectItem, Tab, Tabs, Textarea,
} from "@heroui/react";
import {
    UserIcon, PencilSquareIcon, PhoneIcon, AcademicCapIcon, ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import axios from 'axios';
import { showToast } from '@/utils/toastUtils.jsx';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];

const InfoRow = ({ label, value }) => (
    <div className="p-3 rounded-xl bg-content2">
        <p className="text-xs text-default-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '—'}</p>
    </div>
);

const Profile = ({ title, user = {}, employee = {} }) => {
    const themeRadius = useThemeRadius();
    const { canUpdate, isSuperAdmin } = useHRMAC();
    const canEdit = canUpdate('hrm.self-service.profile') || isSuperAdmin();

    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        phone: employee.phone || '',
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || '',
        nationality: employee.nationality || '',
        address_line_1: employee.address_line_1 || '',
        city: employee.city || '',
        state: employee.state || '',
        country: employee.country || '',
        zip_code: employee.zip_code || '',
    });

    const handleSubmit = () => {
        setSubmitting(true);
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.put(route('selfservice.profile.update'), form);
                if (response.status === 200) {
                    resolve([response.data.message || 'Profile updated successfully']);
                    setEditModalOpen(false);
                    setFormErrors({});
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    setFormErrors(error.response.data.errors || {});
                }
                reject(error.response?.data?.message || 'Failed to update profile');
            } finally { setSubmitting(false); }
        });
        showToast.promise(promise, {
            loading: 'Saving profile...',
            success: (d) => d.join(', '),
            error: (e) => String(e),
        });
    };

    const fullName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || user.name || 'Employee';

    return (
        <>
            <Head title={title || 'My Profile'} />

            {editModalOpen && (
                <Modal isOpen scrollBehavior="inside" size="2xl"
                    onOpenChange={(open) => { setEditModalOpen(open); if (!open) setFormErrors({}); }}
                    classNames={{ base: 'bg-content1', header: 'border-b border-divider', footer: 'border-t border-divider' }}>
                    <ModalContent>
                        <ModalHeader>Edit Personal Information</ModalHeader>
                        <ModalBody className="py-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Phone" placeholder="Enter phone number" radius={themeRadius}
                                    value={form.phone} onValueChange={(v) => setForm(p => ({ ...p, phone: v }))}
                                    isInvalid={!!formErrors.phone} errorMessage={formErrors.phone} />
                                <Input type="date" label="Date of Birth" radius={themeRadius}
                                    value={form.date_of_birth}
                                    onChange={(e) => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                                    isInvalid={!!formErrors.date_of_birth} errorMessage={formErrors.date_of_birth} />
                                <Select label="Gender" placeholder="Select gender" radius={themeRadius}
                                    selectedKeys={form.gender ? [form.gender] : []}
                                    onSelectionChange={(keys) => setForm(p => ({ ...p, gender: Array.from(keys)[0] || '' }))}
                                    isInvalid={!!formErrors.gender} errorMessage={formErrors.gender}>
                                    {GENDERS.map(g => <SelectItem key={g}>{g.replace('_', ' ')}</SelectItem>)}
                                </Select>
                                <Input label="Nationality" placeholder="Enter nationality" radius={themeRadius}
                                    value={form.nationality} onValueChange={(v) => setForm(p => ({ ...p, nationality: v }))}
                                    isInvalid={!!formErrors.nationality} errorMessage={formErrors.nationality} />
                            </div>
                            <Input label="Address" placeholder="Enter address line" radius={themeRadius}
                                value={form.address_line_1} onValueChange={(v) => setForm(p => ({ ...p, address_line_1: v }))}
                                isInvalid={!!formErrors.address_line_1} errorMessage={formErrors.address_line_1} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="City" placeholder="City" radius={themeRadius}
                                    value={form.city} onValueChange={(v) => setForm(p => ({ ...p, city: v }))}
                                    isInvalid={!!formErrors.city} errorMessage={formErrors.city} />
                                <Input label="State" placeholder="State" radius={themeRadius}
                                    value={form.state} onValueChange={(v) => setForm(p => ({ ...p, state: v }))}
                                    isInvalid={!!formErrors.state} errorMessage={formErrors.state} />
                                <Input label="Country" placeholder="Country" radius={themeRadius}
                                    value={form.country} onValueChange={(v) => setForm(p => ({ ...p, country: v }))}
                                    isInvalid={!!formErrors.country} errorMessage={formErrors.country} />
                                <Input label="Zip Code" placeholder="Zip code" radius={themeRadius}
                                    value={form.zip_code} onValueChange={(v) => setForm(p => ({ ...p, zip_code: v }))}
                                    isInvalid={!!formErrors.zip_code} errorMessage={formErrors.zip_code} />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="flat" onPress={() => { setEditModalOpen(false); setFormErrors({}); }}>Cancel</Button>
                            <Button color="primary" isLoading={submitting} onPress={handleSubmit}>Save Changes</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}

            <StandardPageLayout
                title={fullName}
                subtitle={[employee.designation?.name, employee.department?.name].filter(Boolean).join(' · ')}
                icon={<UserIcon />}
                actions={canEdit && (
                    <Button color="primary" variant="shadow" startContent={<PencilSquareIcon className="w-4 h-4" />}
                        size={isMobile ? 'sm' : 'md'} onPress={() => setEditModalOpen(true)}>
                        Edit Profile
                    </Button>
                )}
                ariaLabel="My Profile"
            >
                {/* Profile Summary */}
                <div className="flex items-center gap-4 p-4 mb-6 rounded-xl bg-content2">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <UserIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-foreground truncate">{fullName}</h3>
                        {employee.designation?.name && (
                            <p className="text-sm text-default-500">{employee.designation.name}</p>
                        )}
                        <p className="text-xs text-default-400">{user.email || ''}</p>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs aria-label="Profile sections" radius={themeRadius} color="primary">
                    <Tab key="personal" title={
                        <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            {!isMobile && <span>Personal Info</span>}
                        </div>
                    }>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoRow label="Phone" value={employee.phone} />
                            <InfoRow label="Date of Birth" value={employee.date_of_birth} />
                            <InfoRow label="Gender" value={employee.gender} />
                            <InfoRow label="Nationality" value={employee.nationality} />
                            <InfoRow label="Address" value={employee.address_line_1} />
                            <InfoRow label="City" value={employee.city} />
                            <InfoRow label="State" value={employee.state} />
                            <InfoRow label="Country" value={employee.country} />
                            <InfoRow label="Zip Code" value={employee.zip_code} />
                        </div>
                    </Tab>

                    <Tab key="emergency" title={
                        <div className="flex items-center gap-2">
                            <ExclamationCircleIcon className="w-4 h-4" />
                            {!isMobile && <span>Emergency Contacts</span>}
                        </div>
                    }>
                        <div className="mt-4 space-y-3">
                            <p className="text-xs text-warning-700 dark:text-warning bg-warning/10 border border-warning/30 rounded-lg p-3">
                                Emergency contact information is managed by HR. Please contact your HR department to update this information.
                            </p>
                            {(employee.emergencyContacts || []).length > 0 ? (
                                (employee.emergencyContacts || []).map((contact, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-content2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-foreground">{contact.name}</p>
                                            <p className="text-sm text-default-500">{contact.relationship}</p>
                                        </div>
                                        <p className="text-sm text-default-400">{contact.phone}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-default-400">
                                    <ExclamationCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No emergency contacts on file.</p>
                                </div>
                            )}
                        </div>
                    </Tab>

                    <Tab key="education" title={
                        <div className="flex items-center gap-2">
                            <AcademicCapIcon className="w-4 h-4" />
                            {!isMobile && <span>Education</span>}
                        </div>
                    }>
                        <div className="mt-4 space-y-3">
                            {(employee.education || []).length > 0 ? (
                                (employee.education || []).map((edu, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-content2">
                                        <p className="font-medium text-foreground">
                                            {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                                        </p>
                                        <p className="text-sm text-default-500">{edu.institution}</p>
                                        <p className="text-xs text-default-400">
                                            {edu.start_year} – {edu.end_year || 'Present'}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-default-400">
                                    <AcademicCapIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">No education records on file.</p>
                                </div>
                            )}
                        </div>
                    </Tab>
                </Tabs>
            </StandardPageLayout>
        </>
    );
};

Profile.layout = (page) => <App children={page} />;
export default Profile;
