import React, { useEffect, useState } from "react";
import {
    Checkbox,
    Button,
    Spinner,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell
} from "@heroui/react";
import { X, Download } from 'lucide-react';

import { showToast } from "@/utils/toastUtils";

import * as XLSX from 'xlsx';
import axios from "axios";


const DailyWorksDownloadForm = ({ open, closeModal, search, filterData, users }) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('dailyWorks.all'), {
                    params: {
                        search,
                        status: filterData.status !== 'all' ? filterData.status : '',
                        inCharge: filterData.incharge !== 'all' ? filterData.incharge : '',
                        startDate: filterData.startDate,
                        endDate: filterData.endDate,
                    }
                });
                setData(response.data);
            } catch (error) {
                console.error(error);
                showToast.error('Failed to fetch data.', {
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary,
                    },
                });
            }
        };

        fetchData();
    }, [filterData, search]);

    const [processing, setProcessing] = useState(false);

    const columns = [

        { label: 'Date', key: 'date'  },
        { label: 'RFI No.', key: 'number' },
        { label: 'Status', key: 'status' },
        { label: 'Assigned', key: 'assigned'},  // Visible for admin users
        { label: 'In charge', key: 'incharge' },   // Visible for SE users
        { label: 'Type', key: 'type' },
        { label: 'Description', key: 'description' },
        { label: 'Location', key: 'location' },
        { label: 'Side', key: 'side' },
        { label: 'Quantity/Layer', key: 'qty_layer' },
        { label: 'Planned Time', key: 'planned_time' },
        { label: 'Completion Time', key: 'completion_time' },
        { label: 'Results', key: 'inspection_details' },
        { label: 'Resubmission Count', key: 'resubmission_count' },
        { label: 'RFI Submission Date', key: 'rfi_submission_date' },


    ];

    const [selectedColumns, setSelectedColumns] = useState(
        columns.map(column => ({ ...column, checked: true })) // All columns checked by default
    );

    const handleCheckboxChange = (index) => {
        const newColumns = [...selectedColumns];
        newColumns[index].checked = !newColumns[index].checked;
        setSelectedColumns(newColumns);
    };

    // Function to handle export with selected columns
    const exportToExcel = async (selectedColumns) => {
        const promise = new Promise((resolve, reject) => {
            try {
                // Filter the columns based on the user's selection
                const exportData = data.map(row => {
                    const selectedRow = {};

                    selectedColumns.forEach(column => {
                        if (column.checked) {
                            if (column.key === 'incharge' || column.key === 'assigned') {
                                // Fetch the user by matching the id
                                const user = users.find(user => user.id === row[column.key]);

                                // Assign the username or other desired attribute
                                selectedRow[column.label] = user ? user.name : 'N/A'; // Use 'Unknown' if no user is found
                            } else if (column.key === 'status') {
                                // Capitalize the first character of the status value
                                const statusValue = row[column.key];
                                selectedRow[column.label] = statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
                            } else {
                                // Assign the value directly from the row
                                selectedRow[column.label] = row[column.key];
                            }
                        }
                    });

                    return selectedRow;
                });

                // Create and download Excel file
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Works');
                XLSX.writeFile(workbook, 'DailyWorks.xlsx');

                // Notify success
                resolve('Export successful!');
                closeModal(); // Close the modal

            } catch (error) {
                // Handle any errors that occur during the export process
                reject('Failed to export data. Please try again.');
                console.error("Error exporting data to Excel:", error);
            }
        });

        showToast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <CircularProgress />
                                <span style={{ marginLeft: '8px' }}>Exporting data to Excel ...</span>
                            </div>
                        );
                    },
                    icon: false,
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary
                    }
                },
                success: {
                    render({ data }) {
                        return (
                            <>
                                {data}
                            </>
                        );
                    },
                    icon: '🟢',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary
                    }
                },
                error: {
                    render({ data }) {
                        return (
                            <>
                                {data}
                            </>
                        );
                    },
                    icon: '🔴',
                    style: {
                        backdropFilter: 'blur(16px) saturate(200%)',
                        background: theme.glassCard.background,
                        border: theme.glassCard.border,
                        color: theme.palette.text.primary
                    }
                }
            }
        );
    };





    return (
        <Modal 
            isOpen={open} 
            onClose={closeModal}
            size="lg"
            classNames={{
                base: "border border-divider bg-content1 shadow-lg",
                header: "border-b border-divider",
                footer: "border-t border-divider",
            }}
        >
            <ModalContent>
                <ModalHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Export Daily Works</h2>
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={closeModal}
                        className="absolute top-2 right-2"
                    >
                        <X size={20} />
                    </Button>
                </ModalHeader>
                <ModalBody>
                    <Table aria-label="Export columns selection">
                        <TableHeader>
                            <TableColumn>Column Label</TableColumn>
                            <TableColumn align="center">Include in Export</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {selectedColumns.map((column, index) => (
                                <TableRow key={column.key}>
                                    <TableCell>{column.label}</TableCell>
                                    <TableCell className="text-center">
                                        <Checkbox
                                            isSelected={column.checked}
                                            onValueChange={() => handleCheckboxChange(index)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ModalBody>
                <ModalFooter className="flex justify-center">
                    <Button
                        variant="bordered"
                        color="primary"
                        onPress={() => exportToExcel(selectedColumns)}
                        startContent={<Download size={16} />}
                        className="rounded-full px-4 py-2"
                    >
                        Download
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default DailyWorksDownloadForm;
