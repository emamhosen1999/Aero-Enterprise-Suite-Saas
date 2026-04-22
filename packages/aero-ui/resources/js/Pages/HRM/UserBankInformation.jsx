import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
	Button,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalFooter,
	ModalHeader,
} from '@heroui/react';
import { BanknotesIcon, CreditCardIcon, PencilSquareIcon, UserIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import App from '@/Layouts/App.jsx';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import StatsCards from '@/Components/StatsCards.jsx';
import { useHRMAC } from '@/Hooks/useHRMAC';
import { useThemeRadius } from '@/Hooks/useThemeRadius.js';
import { showToast } from '@/utils/toastUtils.jsx';

const EMPTY_FORM = {
	bank_name: '',
	account_number: '',
	account_holder_name: '',
	account_type: '',
	branch_name: '',
	swift_code: '',
	iban: '',
	routing_number: '',
};

const maskAccountNumber = (value) => {
	if (!value) {
		return '—';
	}

	const trimmed = String(value);
	if (trimmed.length <= 4) {
		return trimmed;
	}

	return `${'*'.repeat(Math.max(trimmed.length - 4, 0))}${trimmed.slice(-4)}`;
};

const UserBankInformation = ({ title, employee = null, bankDetail = null }) => {
	const themeRadius = useThemeRadius();
	const { canUpdate, isSuperAdmin } = useHRMAC();
	const canEdit = canUpdate('hrm.employees.self-service') || isSuperAdmin();

	const [isMobile, setIsMobile] = useState(false);
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [formErrors, setFormErrors] = useState({});
	const [form, setForm] = useState(EMPTY_FORM);

	useEffect(() => {
		const checkScreenSize = () => setIsMobile(window.innerWidth < 640);
		checkScreenSize();
		window.addEventListener('resize', checkScreenSize);
		return () => window.removeEventListener('resize', checkScreenSize);
	}, []);

	useEffect(() => {
		setForm({
			bank_name: bankDetail?.bank_name || '',
			account_number: bankDetail?.account_number || '',
			account_holder_name: bankDetail?.account_holder_name || '',
			account_type: bankDetail?.account_type || '',
			branch_name: bankDetail?.branch_name || '',
			swift_code: bankDetail?.swift_code || '',
			iban: bankDetail?.iban || '',
			routing_number: bankDetail?.routing_number || '',
		});
	}, [bankDetail]);

	const statsData = useMemo(() => [
		{
			title: 'Bank Profile',
			value: bankDetail ? 'Available' : 'Missing',
			icon: <BanknotesIcon className="w-6 h-6" />,
			color: bankDetail ? 'text-success' : 'text-warning',
			iconBg: bankDetail ? 'bg-success/20' : 'bg-warning/20',
		},
		{
			title: 'Account Type',
			value: bankDetail?.account_type || 'Not Set',
			icon: <CreditCardIcon className="w-6 h-6" />,
			color: 'text-primary',
			iconBg: 'bg-primary/20',
		},
		{
			title: 'Branch',
			value: bankDetail?.branch_name || 'Not Set',
			icon: <UserIcon className="w-6 h-6" />,
			color: 'text-secondary',
			iconBg: 'bg-secondary/20',
		},
	], [bankDetail]);

	const handleSubmit = () => {
		setSubmitting(true);

		const promise = new Promise(async (resolve, reject) => {
			try {
				const response = await axios.put(route('selfservice.bank-information.update'), form);

				if (response.status === 200) {
					setFormErrors({});
					setIsEditOpen(false);
					router.reload({ only: ['bankDetail'] });
					resolve([response.data.message || 'Bank information updated successfully']);
				}
			} catch (error) {
				if (error.response?.status === 422) {
					setFormErrors(error.response.data.errors || {});
				}

				reject(error.response?.data?.message || 'Failed to update bank information');
			} finally {
				setSubmitting(false);
			}
		});

		showToast.promise(promise, {
			loading: 'Updating bank information...',
			success: (data) => data.join(', '),
			error: (message) => String(message),
		});
	};

	const fullName = `${employee?.first_name || ''} ${employee?.last_name || ''}`.trim() || 'Employee';

	return (
		<>
			<Head title={title || 'Bank Information'} />

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
						<ModalHeader>Edit Bank Information</ModalHeader>
						<ModalBody>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<Input
									label="Bank Name"
									value={form.bank_name}
									onValueChange={(value) => setForm((current) => ({ ...current, bank_name: value }))}
									isInvalid={!!formErrors.bank_name}
									errorMessage={formErrors.bank_name}
									radius={themeRadius}
									isRequired
								/>
								<Input
									label="Account Holder"
									value={form.account_holder_name}
									onValueChange={(value) => setForm((current) => ({ ...current, account_holder_name: value }))}
									isInvalid={!!formErrors.account_holder_name}
									errorMessage={formErrors.account_holder_name}
									radius={themeRadius}
									isRequired
								/>
								<Input
									label="Account Number"
									value={form.account_number}
									onValueChange={(value) => setForm((current) => ({ ...current, account_number: value }))}
									isInvalid={!!formErrors.account_number}
									errorMessage={formErrors.account_number}
									radius={themeRadius}
									isRequired
								/>
								<Input
									label="Account Type"
									value={form.account_type}
									onValueChange={(value) => setForm((current) => ({ ...current, account_type: value }))}
									isInvalid={!!formErrors.account_type}
									errorMessage={formErrors.account_type}
									radius={themeRadius}
								/>
								<Input
									label="Branch Name"
									value={form.branch_name}
									onValueChange={(value) => setForm((current) => ({ ...current, branch_name: value }))}
									isInvalid={!!formErrors.branch_name}
									errorMessage={formErrors.branch_name}
									radius={themeRadius}
								/>
								<Input
									label="SWIFT Code"
									value={form.swift_code}
									onValueChange={(value) => setForm((current) => ({ ...current, swift_code: value }))}
									isInvalid={!!formErrors.swift_code}
									errorMessage={formErrors.swift_code}
									radius={themeRadius}
								/>
								<Input
									label="IBAN"
									value={form.iban}
									onValueChange={(value) => setForm((current) => ({ ...current, iban: value }))}
									isInvalid={!!formErrors.iban}
									errorMessage={formErrors.iban}
									radius={themeRadius}
								/>
								<Input
									label="Routing Number"
									value={form.routing_number}
									onValueChange={(value) => setForm((current) => ({ ...current, routing_number: value }))}
									isInvalid={!!formErrors.routing_number}
									errorMessage={formErrors.routing_number}
									radius={themeRadius}
								/>
							</div>
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
				subtitle="Banking and payment details"
				icon={<BanknotesIcon className="w-6 h-6" />}
				iconColorClass="text-success"
				iconBgClass="bg-success/20"
				stats={<StatsCards stats={statsData} />}
				actions={canEdit && (
					<Button
						color="primary"
						variant="shadow"
						size={isMobile ? 'sm' : 'md'}
						startContent={<PencilSquareIcon className="w-4 h-4" />}
						onPress={() => setIsEditOpen(true)}
					>
						Edit Bank Details
					</Button>
				)}
				ariaLabel="User bank information"
			>
				<div className="rounded-xl border border-divider bg-content1 p-4">
					<h3 className="mb-4 text-base font-semibold">Bank Account Details</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">Bank Name</p>
							<p className="text-sm font-medium">{bankDetail?.bank_name || '—'}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">Account Holder</p>
							<p className="text-sm font-medium">{bankDetail?.account_holder_name || fullName}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">Account Number</p>
							<p className="text-sm font-medium">{maskAccountNumber(bankDetail?.account_number)}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">Account Type</p>
							<p className="text-sm font-medium">{bankDetail?.account_type || '—'}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">Branch Name</p>
							<p className="text-sm font-medium">{bankDetail?.branch_name || '—'}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">SWIFT Code</p>
							<p className="text-sm font-medium">{bankDetail?.swift_code || '—'}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">IBAN</p>
							<p className="text-sm font-medium break-all">{bankDetail?.iban || '—'}</p>
						</div>
						<div className="rounded-lg bg-content2 p-3">
							<p className="text-xs text-default-500">Routing Number</p>
							<p className="text-sm font-medium">{bankDetail?.routing_number || '—'}</p>
						</div>
					</div>
				</div>
			</StandardPageLayout>
		</>
	);
};

UserBankInformation.layout = (page) => <App children={page} />;

export default UserBankInformation;
