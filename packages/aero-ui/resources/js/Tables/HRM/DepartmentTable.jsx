import React, {useMemo} from 'react';
import {usePage} from "@inertiajs/react";
import {
    Button,
    Chip,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownTrigger,
    Pagination,
    Spinner,
    Table,
    TableBody,
    TableCell,
    TableColumn,
    TableHeader,
    TableRow,
    Tooltip,
    User
} from "@heroui/react";
import {
    BuildingOffice2Icon,
    BuildingOfficeIcon,
    CalendarIcon,
    CheckCircleIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    MapPinIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
    UsersIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import NoDataMessage from '@/Components/NoDataMessage';

const DepartmentTable = ({ 
    departments, 
    onEdit, 
    onDelete, 
    onView, 
    loading, 
    isMobile,
    isTablet, 
    pagination, 
    onPageChange, 
    onRowsPerPageChange,
    canEditDepartment = false,
    canDeleteDepartment = false
}) => {
    // Check permissions directly from auth object
    const { auth } = usePage().props;
    const hasEditPermission = canEditDepartment || auth.permissions?.includes('departments.update') || false;
    const hasDeletePermission = canDeleteDepartment || auth.permissions?.includes('departments.delete') || false;
    
    // Set up columns based on screen size
    const columns = useMemo(() => {
        const baseColumns = [
            { name: "DEPARTMENT", uid: "name" },
            { name: "CODE", uid: "code", hide: isMobile },
            { name: "MANAGER", uid: "manager" },
            { name: "EMPLOYEES", uid: "employees" },
            { name: "LOCATION", uid: "location", hide: isMobile },
            { name: "STATUS", uid: "status" },
            { name: "ESTABLISHED", uid: "established", hide: isMobile || isTablet },
            { name: "ACTIONS", uid: "actions" }
        ];
        
        return baseColumns.filter(col => !col.hide);
    }, [isMobile, isTablet]);
    
    // Render cell content
    const renderCell = (department, columnKey) => {
        switch (columnKey) {
            case "name":
                return (
                    <User
                        avatarProps={{ 
                            radius: "lg", 
                            fallback: <BuildingOfficeIcon className="w-8 h-4" />,
                            size: isMobile ? "sm" : "md",
                        }}
                        name={department.name}
                        description={department.parent ? department.parent.name : 'Top-level department'}
                        classNames={{
                            name: "font-semibold text-foreground text-left",
                            description: "text-default-500 text-left text-xs",
                            wrapper: "justify-start"
                        }}
                    />
                );
                
            case "code":
                return (
                    <div>
                        {department.code ? (
                            <Chip
                                size="sm"
                                variant="flat"
                                color="primary"
                                className="text-xs"
                            >
                                {department.code}
                            </Chip>
                        ) : (
                            <span className="text-default-400 text-xs">-</span>
                        )}
                    </div>
                );
                
            case "manager":
                return (
                    <div className="flex items-start ">
                        {department.manager ? (
                            <>
                                <User
                                    avatarProps={{
                                        radius: "lg",
                                        src: department.manager?.profile_image_url || department.manager?.profile_image,
                                        size: "md",
                                fallback: <UserIcon className="w-5 h-5" />
                                }}
                                classNames={{
                                    name: "font-semibold text-foreground text-sm",
                                    description: "text-default-500 text-xs",
                                }}
                            />
                        
                                <div className="flex flex-col">
                                    <span className="text-sm">{department.manager.name}</span>
                                    {!isMobile && department.manager.email && (
                                        <span className="text-xs text-default-400">{department.manager.email}</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <span className="text-default-400 text-xs">Not assigned</span>
                        )}
                    </div>
                );
                
            case "employees":
                return (
                    <div className="flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-default-400" />
                        <span>{department.employee_count || 0}</span>
                    </div>
                );
                
            case "location":
                return (
                    <div className="flex items-center gap-2">
                        {department.location ? (
                            <>
                                <MapPinIcon className="w-4 h-4 text-default-400" />
                                <span>{department.location}</span>
                            </>
                        ) : (
                            <span className="text-default-400 text-xs">-</span>
                        )}
                    </div>
                );
                
            case "status":
                return (
                    <Chip
                        size="sm"
                        variant={department.is_active ? "solid" : "bordered"}
                        color={department.is_active ? "success" : "danger"}
                        startContent={department.is_active ? 
                            <CheckCircleIcon className="w-3 h-3" /> : 
                            <XCircleIcon className="w-3 h-3" />
                        }
                    >
                        {department.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                );
                
            case "established":
                return (
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-default-400" />
                        <span className="text-sm">
                            {department.established_date ? 
                                dayjs(department.established_date).format('MMM D, YYYY') : 
                                <span className="text-default-400 text-xs">-</span>
                            }
                        </span>
                    </div>
                );
                
            case "actions":
                return (
                    <div className="flex justify-end items-center">
                        {!isMobile ? (
                            <>
                                <Tooltip content="View Department">
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="text-default-400 hover:text-foreground"
                                        onPress={() => onView(department)}
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </Button>
                                </Tooltip>
                                
                                {hasEditPermission && (
                                    <Tooltip content="Edit Department">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-default-400 hover:text-blue-500"
                                            onPress={() => onEdit(department)}
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                )}
                                
                                {hasDeletePermission && (
                                    <Tooltip 
                                        content={department.employee_count > 0 ? 
                                            "Cannot delete department with employees" : 
                                            "Delete Department"
                                        }
                                    >
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            className="text-default-400 hover:text-danger"
                                            isDisabled={department.employee_count > 0}
                                            onPress={() => onDelete(department)}
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </Tooltip>
                                )}
                            </>
                        ) : (
                            <Dropdown>
                                <DropdownTrigger>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                    >
                                        <EllipsisVerticalIcon className="w-4 h-4" />
                                    </Button>
                                </DropdownTrigger>
                                <DropdownMenu aria-label="Department actions">
                                    <DropdownItem
                                        key="view"
                                        startContent={<EyeIcon className="w-4 h-4" />}
                                        onPress={() => onView(department)}
                                    >
                                        View Details
                                    </DropdownItem>
                                    
                                    {hasEditPermission && (
                                        <DropdownItem
                                            key="edit"
                                            startContent={<PencilIcon className="w-4 h-4" />}
                                            onPress={() => onEdit(department)}
                                        >
                                            Edit Department
                                        </DropdownItem>
                                    )}
                                    
                                    {hasDeletePermission && (
                                        <DropdownItem
                                            key="delete"
                                            className="text-danger"
                                            color="danger"
                                            startContent={<TrashIcon className="w-4 h-4" />}
                                            isDisabled={department.employee_count > 0}
                                            onPress={() => onDelete(department)}
                                        >
                                            Delete Department
                                        </DropdownItem>
                                    )}
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                );
                
            default:
                return <span>{department[columnKey]}</span>;
        }
    };
    
    // Pagination component
    const renderPagination = () => {
        if (!departments || !departments.data || loading) return null;
        
        return (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-2 border-t border-white/10">
                <span className="text-xs text-default-400 mb-3 sm:mb-0">
                    Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to {
                        Math.min(pagination.currentPage * pagination.perPage, departments.total)
                    } of {departments.total} departments
                </span>
                
                <Pagination
                    total={Math.ceil(departments.total / pagination.perPage)}
                    initialPage={pagination.currentPage}
                    page={pagination.currentPage}
                    onChange={onPageChange}
                    size={isMobile ? "sm" : "md"}
                    variant="bordered"
                    showControls
                    classNames={{
                        item: "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15",
                        cursor: "bg-white/20 backdrop-blur-md border-white/20",
                    }}
                />
            </div>
        );
    };
    
    // If no data and not loading
    if (!loading && (!departments || !departments.data || departments.data.length === 0)) {
        return (
            <div className="w-full">
                <NoDataMessage 
                    message="No departments found" 
                    icon={<BuildingOffice2Icon className="w-12 h-12 text-default-300" />}
                    description="Try adjusting your search or filters"
                />
            </div>
        );
    }
    
    return (
        <div className="w-full">
            <Table
                aria-label="Departments table"
                removeWrapper
                classNames={{
                    base: "bg-transparent",
                    th: "bg-white/5 backdrop-blur-md text-default-500 border-b border-white/10 font-medium text-xs",
                    td: "border-b border-white/5 py-3",
                }}
                bottomContent={renderPagination()}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.uid}>
                            {column.name}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={departments.data || []}
                    emptyContent={!loading && "No departments found"}
                    loadingContent={<Spinner />}
                    isLoading={loading}
                >
                    {(department) => (
                        <TableRow key={department.id}>
                            {(columnKey) => (
                                <TableCell>{renderCell(department, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default DepartmentTable;
