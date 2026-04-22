import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
	Button,
	Chip,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
	Select,
	SelectItem,
	Textarea,
} from '@heroui/react';
import {
	ExclamationTriangleIcon,
	IdentificationIcon,
	PencilSquareIcon,
	UserIcon,
} from '@heroicons/react/24/outline';
import axios from 'axios';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { showToast } from '@/utils/toastUtils.jsx';

const GENDER_OPTIONS = [
	{ key: 'male', label: 'Male' },
	{ key: 'female', label: 'Female' },
	{ key: 'other', label: 'Other' },
	{ key: 'prefer_not_to_say', label: 'Prefer Not To Say' },
];

const MARITAL_STATUS_OPTIONS = [
	{ key: 'single', label: 'Single' },
	{ key: 'married', label: 'Married' },
	{ key: 'divorced', label: 'Divorced' },
	{ key: 'widowed', label: 'Widowed' },
];

const EMPTY_FORM = {
	birthday: '',
	gender: '',
	nationality: '',
	marital_status: '',
	passport_no: '',
};

const formatLabel = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase()) || '—';

const UserInformation = ({ title, user = {}, employee = null }) => {
	const themeRadius = useThemeRadius();
	const { canUpdate, isSuperAdmin } = useHRMAC();
	const canEdit = canUpdate('hrm.employees.self-service') || isSuperAdmin();

	const [isMobile, setIsMobile] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [formErrors, setFormErrors] = useState({});
	const [submitting, setSubmitting] = useState(false);
	const [form, setForm] = useState(EMPTY_FORM);

	useEffect(() => {
		const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, []);

	useEffect(() => {
		setForm({
			birthday: employee?.birthday || '',
			gender: employee?.gender || '',
			nationality: employee?.nationality || '',
			marital_status: employee?.marital_status || '',
			passport_no: employee?.passport_no || '',
		});
	}, [employee]);

	const statsData = useMemo(() => {
		const contactsCount = Array.isArray(employee?.emergency_contacts) ? employee.emergency_contacts.length : 0;

		return [
			{
				title: 'Profile Status',
				value: employee ? 'Available' : 'Missing',
				icon: <UserIcon className="w-6 h-6" />,
				color: employee ? 'text-success' : 'text-warning',
				iconBg: employee ? 'bg-success/20' : 'bg-warning/20',
			},
			{
				title: 'Emergency Contacts',
				value: contactsCount,
				icon: <ExclamationTriangleIcon className="w-6 h-6" />,
				color: 'text-warning',
				iconBg: 'bg-warning/20',
			},
			{
				title: 'Nationality',
				value: employee?.nationality || 'Not Set',
				icon: <IdentificationIcon className="w-6 h-6" />,
				color: 'text-primary',
				iconBg: 'bg-primary/20',
			},
		];
	}, [employee]);

	const handleSubmit = () => {
		setSubmitting(true);

		const promise = new Promise(async (resolve, reject) => {
			try {
				const response = await axios.put(route('selfservice.personal-information.update'), form);

				if (response.status === 200) {
					setFormErrors({});
					setIsEditOpen(false);
					router.reload({ only: ['employee'] });
					resolve([response.data.message || 'Personal information updated successfully']);
				}
			} catch (error) {
				if (error.response?.status === 422) {
					setFormErrors(error.response.data.errors || {});
				}

				reject(error.response?.data?.message || 'Failed to update personal information');
			} finally {
				setSubmitting(false);
			}
		});

		showToast.promise(promise, {
			loading: 'Updating personal information...',
			success: (data) => data.join(', '),
			error: (message) => String(message),
		});
	};

	const fullName = `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || user?.name || 'Employee';

	return (
		<>
			<Head title={title || 'Personal Information'} />

			{isEditOpen && (
				<Modal
					isOpen
					onOpenChange={(open) => {
						setIsEditOpen(open);
						if (!open) {
							setFormErrors({});
						}
					}}
					size="2xl"
					scrollBehavior="inside"
					classNames={{
						base: 'bg-content1',
						header: 'border-b border-divider',
						body: 'py-6',
						footer: 'border-t border-divider',
					}}
				>
					<ModalContent>
						<ModalHeader>Edit Personal Information</ModalHeader>
						<ModalBody>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input
									type="date"
									label="Birthday"
									value={form.birthday}
									onChange={(event) => setForm((current) => ({ ...current, birthday: event.target.value }))}
									isInvalid={!!formErrors.birthday}
									errorMessage={formErrors.birthday}
									radius={themeRadius}
								/>
								<Select
									label="Gender"
									selectedKeys={form.gender ? [form.gender] : []}
									onSelectionChange={(keys) => setForm((current) => ({ ...current, gender: Array.from(keys)[0] || '' }))}
									isInvalid={!!formErrors.gender}
									errorMessage={formErrors.gender}
									radius={themeRadius}
								>
									{GENDER_OPTIONS.map((option) => (
										<SelectItem key={option.key}>{option.label}</SelectItem>
									))}
								</Select>
								<Input
									label="Nationality"
									value={form.nationality}
									onValueChange={(value) => setForm((current) => ({ ...current, nationality: value }))}
									isInvalid={!!formErrors.nationality}
									errorMessage={formErrors.nationality}
									radius={themeRadius}
								/>
								<Select
									label="Marital Status"
									selectedKeys={form.marital_status ? [form.marital_status] : []}
									onSelectionChange={(keys) => setForm((current) => ({ ...current, marital_status: Array.from(keys)[0] || '' }))}
									isInvalid={!!formErrors.marital_status}
									errorMessage={formErrors.marital_status}
									radius={themeRadius}
								>
									{MARITAL_STATUS_OPTIONS.map((option) => (
										<SelectItem key={option.key}>{option.label}</SelectItem>
									))}
								</Select>
							</div>
							<Input
								label="Passport Number"
								value={form.passport_no}
								onValueChange={(value) => setForm((current) => ({ ...current, passport_no: value }))}
								isInvalid={!!formErrors.passport_no}
								errorMessage={formErrors.passport_no}
								radius={themeRadius}
							/>
						</ModalBody>
						<ModalFooter>
							<Button variant="flat" onPress={() => setIsEditOpen(false)}>Cancel</Button>
							<Button color="primary" isLoading={submitting} onPress={handleSubmit}>Save Changes</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>
			)}

			<StandardPageLayout
				title={fullName}
				subtitle="Personal details and emergency contacts"
				icon={<UserIcon className="w-6 h-6" />}
				iconColorClass="text-primary"
				iconBgClass="bg-primary/20"
				stats={<StatsCards stats={statsData} />}
				actions={canEdit && (
					<Button
						color="primary"
						variant="shadow"
						size={isMobile ? 'sm' : 'md'}
						startContent={<PencilSquareIcon className="w-4 h-4" />}
						onPress={() => setIsEditOpen(true)}
					>
						Edit Information
					</Button>
				)}
				ariaLabel="User personal information"
			>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="space-y-4 rounded-xl border border-divider bg-content1 p-4">
						<h3 className="text-base font-semibold">Personal Details</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div className="rounded-lg bg-content2 p-3">
								<p className="text-xs text-default-500">Birthday</p>
								<p className="text-sm font-medium">{employee?.birthday || '—'}</p>
							</div>
							<div className="rounded-lg bg-content2 p-3">
								<p className="text-xs text-default-500">Gender</p>
								<p className="text-sm font-medium">{formatLabel(employee?.gender)}</p>
							</div>
							<div className="rounded-lg bg-content2 p-3">
								<p className="text-xs text-default-500">Nationality</p>
								<p className="text-sm font-medium">{employee?.nationality || '—'}</p>
							</div>
							<div className="rounded-lg bg-content2 p-3">
								<p className="text-xs text-default-500">Marital Status</p>
								<p className="text-sm font-medium">{formatLabel(employee?.marital_status)}</p>
							</div>
							<div className="rounded-lg bg-content2 p-3 sm:col-span-2">
								<p className="text-xs text-default-500">Passport Number</p>
								<p className="text-sm font-medium">{employee?.passport_no || '—'}</p>
							</div>
						</div>
					</div>

					<div className="space-y-4 rounded-xl border border-divider bg-content1 p-4">
						<h3 className="text-base font-semibold">Emergency Contacts</h3>
						{Array.isArray(employee?.emergency_contacts) && employee.emergency_contacts.length > 0 ? (
							<div className="space-y-3">
								{employee.emergency_contacts.map((contact) => (
									<div key={contact.id} className="rounded-lg bg-content2 p-3">
										<div className="flex items-center justify-between gap-2">
											<p className="text-sm font-medium">{contact.name || 'Unknown Contact'}</p>
											<Chip size="sm" variant="flat" color="warning">{contact.relationship || 'Contact'}</Chip>
										</div>
										<p className="mt-2 text-sm text-default-600">Phone: {contact.phone || '—'}</p>
										<p className="text-sm text-default-500">Email: {contact.email || '—'}</p>
									</div>
								))}
							</div>
						) : (
							<div className="rounded-lg border border-dashed border-divider p-6 text-center text-default-500">
								<ExclamationTriangleIcon className="mx-auto mb-3 h-10 w-10 opacity-40" />
								<p className="text-sm">No emergency contacts found.</p>
								<p className="text-xs">Contact HR if this information needs to be updated.</p>
							</div>
						)}
					</div>
				</div>
			</StandardPageLayout>
		</>
	);
};

UserInformation.layout = (page) => <App children={page} />;

export default UserInformation;
