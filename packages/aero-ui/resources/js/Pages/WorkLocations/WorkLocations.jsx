import React, { useState, useCallback, useMemo } from 'react';
import { 
    MapPinIcon, 
    PlusIcon,
    ChartBarIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ClockIcon,
    UserIcon
} from "@heroicons/react/24/outline";
import { Head } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import WorkLocationsTable from '@/Tables/HRM/WorkLocationsTable.jsx';
import { 
    Card, 
    CardBody, 
    Input, 
    Button,
} from "@heroui/react";
import StatsCards from "@/Components/StatsCards.jsx";
import { useMediaQuery } from '@/Hooks/useMediaQuery.js';
import useThemeRadius from '@/Hooks/useThemeRadius.js';
import StandardPageLayout from '@/Layouts/StandardPageLayout.jsx';
import WorkLocationForm from "@/Forms/HRM/WorkLocationForm.jsx";
import DeleteWorkLocationForm from "@/Forms/HRM/DeleteWorkLocationForm.jsx";
import axios from "axios";
import { showToast } from "@/utils/toastUtils";

const WorkLocations = React.memo(({ auth, title, jurisdictions, users }) => {
    const isMobile = useMediaQuery('(max-width: 640px)');

    const themeRadius = useThemeRadius();

    const [data, setData] = useState(jurisdictions || []);
    const [loading, setLoading] = useState(false);
    const [currentRow, setCurrentRow] = useState();
    const [locationIdToDelete, setLocationIdToDelete] = useState(null);
    const [openModalType, setOpenModalType] = useState(null);
    const [search, setSearch] = useState('');

    const handleSearch = useCallback((event) => {
        setSearch(event.target.value);
    }, []);

    const handleDelete = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post('/work-locations/delete', {
                    id: locationIdToDelete,
                });

                if (response.status === 200) {
                    setData(response.data.work_locations);
                    resolve(['Work location deleted successfully!']);
                }
            } catch (error) {
                if (error.response?.status === 422) {
                    reject(error.response.data.errors || ['Validation failed']);
                } else {
                    reject([error.response?.data?.message || 'Failed to delete work location. Please try again.']);
                }
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting work location...',
            success: (data) => data[0],
            error: (data) => Array.isArray(data) ? data[0] : data,
        });
    };

    const handleClickOpen = useCallback((locationId, modalType) => {
        setLocationIdToDelete(locationId);
        setOpenModalType(modalType);
    }, []);

    const handleClose = useCallback(() => {
        setOpenModalType(null);
        setLocationIdToDelete(null);
    }, []);

    const openModal = useCallback((modalType) => {
        setOpenModalType(modalType);
    }, []);

    const closeModal = useCallback(() => {
        setOpenModalType(null);
    }, []);

    // Statistics
    const stats = useMemo(() => {
        const totalLocations = data.length;
        const activeLocations = data.filter(location => location.incharge_user).length;
        const pendingLocations = data.filter(location => !location.incharge_user).length;

        return [
            {
                title: 'Total Locations',
                value: totalLocations,
                icon: <ChartBarIcon className="w-5 h-5" />,
                color: 'text-blue-600',
                description: 'All work locations'
            },
            {
                title: 'Active',
                value: activeLocations,
                icon: <CheckCircleIcon className="w-5 h-5" />,
                color: 'text-green-600',
                description: 'With assigned staff'
            },
            {
                title: 'Pending',
                value: pendingLocations,
                icon: <ClockIcon className="w-5 h-5" />,
                color: 'text-orange-600',
                description: 'Needs assignment'
            },
            {
                title: 'Staff',
                value: users?.length || 0,
                icon: <UserIcon className="w-5 h-5" />,
                color: 'text-purple-600',
                description: 'Available staff'
            }
        ];
    }, [data, users]);

    // Action buttons configuration
    const actionButtons = [
        ...(auth.roles.includes('Administrator') || auth.permissions.includes('jurisdiction.create') ? [{
            label: "Add Location",
            icon: <PlusIcon className="w-4 h-4" />,
            onPress: () => openModal('addWorkLocation'),
            className: "bg-linear-to-r from-blue-500 to-purple-500 text-white font-medium"
        }] : []),
    ];

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!search) return data;
        return data.filter(location => 
            location.location?.toLowerCase().includes(search.toLowerCase()) ||
            location.start_chainage?.toLowerCase().includes(search.toLowerCase()) ||
            location.end_chainage?.toLowerCase().includes(search.toLowerCase()) ||
            location.incharge_user?.name?.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    return (
        <>
            <Head title={title} />

            {/* Modals */}
            {openModalType === 'addWorkLocation' && (
                <WorkLocationForm
                    modalType="add"
                    open={openModalType === 'addWorkLocation'}
                    setData={setData}
                    closeModal={closeModal}
                    users={users}
                />
            )}
            {openModalType === 'editWorkLocation' && (
                <WorkLocationForm
                    modalType="update"
                    open={openModalType === 'editWorkLocation'}
                    currentRow={currentRow}
                    setData={setData}
                    closeModal={closeModal}
                    users={users}
                />
            )}
            {openModalType === 'deleteWorkLocation' && (
                <DeleteWorkLocationForm
                    open={openModalType === 'deleteWorkLocation'}
                    handleClose={handleClose}
                    handleDelete={handleDelete}
                />
            )}

            <StandardPageLayout
                ariaLabel="Work Locations Management"
                title="Work Locations Management"
                subtitle="Manage jurisdictions and work location assignments"
                icon={MapPinIcon}
                actions={
                    <div className="flex items-center gap-2">
                        {actionButtons.map((button, index) => (
                            <Button
                                key={index}
                                size={isMobile ? 'sm' : 'md'}
                                variant={button.variant || 'flat'}
                                color={button.color || 'primary'}
                                startContent={button.icon}
                                onPress={button.onPress}
                                className={`${button.className || ''} font-medium`}
                                style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                            >
                                {button.label}
                            </Button>
                        ))}
                    </div>
                }
                stats={<StatsCards stats={stats} />}
                filters={
                    <div className="w-full sm:w-auto sm:min-w-[300px]">
                        <Input
                            type="text"
                            placeholder="Search by location, chainage, or incharge..."
                            value={search}
                            onChange={(e) => handleSearch(e)}
                            variant="bordered"
                            size={isMobile ? 'sm' : 'md'}
                            radius={themeRadius}
                            startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                            classNames={{
                                input: 'text-foreground',
                                inputWrapper: `bg-content2/50 hover:bg-content2/70 
                                             focus-within:bg-content2/90 border-divider/50 
                                             hover:border-divider data-[focus]:border-primary`,
                            }}
                            style={{ fontFamily: `var(--fontFamily, "Inter")` }}
                        />
                    </div>
                }
            >
                <Card
                    radius={themeRadius}
                    className="bg-content2/50 backdrop-blur-md border border-divider/30"
                    style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                        backgroundColor: 'var(--theme-content2)',
                        borderColor: 'var(--theme-divider)',
                    }}
                >
                    <CardBody className="p-4">
                        <WorkLocationsTable
                            allData={filteredData}
                            setData={setData}
                            loading={loading}
                            setLoading={setLoading}
                            handleClickOpen={handleClickOpen}
                            openModal={openModal}
                            setCurrentRow={setCurrentRow}
                            users={users}
                            auth={auth}
                        />
                    </CardBody>
                </Card>
            </StandardPageLayout>
        </>
    );
});

WorkLocations.layout = (page) => <App>{page}</App>;

export default WorkLocations;
