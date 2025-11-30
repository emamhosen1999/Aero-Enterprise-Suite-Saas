import React, {useState} from "react";
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
    TableCell,
} from "@heroui/react";
import { X, Download } from 'lucide-react';

import { showToast } from "@/utils/toastUtils";

import * as XLSX from 'xlsx';


const DailyWorkSummaryDownloadForm = ({ open, closeModal,  filteredData, users }) => {

    const [processing, setProcessing] = useState(false);

    const columns = [
        { label: 'Date', key: 'date' },
        { label: 'Total Daily Works', key: 'totalDailyWorks' },
        { label: 'Resubmissions', key: 'resubmissions' },
        { label: 'Embankment', key: 'embankment' },
        { label: 'Structure', key: 'structure' },
        { label: 'Pavement', key: 'pavement' },
        { label: 'Completed', key: 'completed' },
        { label: 'Pending', key: 'pending' },
        { label: 'Completion Percentage', key: 'completionPercentage' },
        { label: 'RFI Submissions', key: 'rfiSubmissions' },
        { label: 'RFI Submission Percentage', key: 'rfiSubmissionPercentage' },

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
                // Check if there are selected columns
                if (!selectedColumns || selectedColumns.length === 0) {
                    reject('No columns selected for export.');
                    return;
                }

                // Filter the data based on the selected columns
                const exportData = filteredData.map(row => {
                    const selectedRow = {};

                    // Calculate completion percentage and RFI submission percentage
                    const totalDailyWorks = row.totalDailyWorks || 0;
                    const completed = row.completed || 0;
                    const rfiSubmissions = row.rfiSubmissions || 0;

                    const pending = totalDailyWorks > 0
                        ? `${((totalDailyWorks - completed))}`
                        : '0';

                    const completionPercentage = totalDailyWorks > 0
                        ? `${((completed / totalDailyWorks) * 100).toFixed(1)}%`
                        : '0%';

                    const rfiSubmissionPercentage = totalDailyWorks > 0
                        ? `${((rfiSubmissions / totalDailyWorks) * 100).toFixed(1)}%`
                        : '0%';

                    // Loop through selected columns and populate selectedRow
                    selectedColumns.forEach(column => {
                        if (column.checked) {
                            if (column.key === 'pending') {
                                selectedRow[column.label] = pending;
                            } else if (column.key === 'completionPercentage') {
                                selectedRow[column.label] = completionPercentage;
                            } else if (column.key === 'rfiSubmissionPercentage') {
                                selectedRow[column.label] = rfiSubmissionPercentage;
                            } else {
                                selectedRow[column.label] = row[column.key] || ''; // Fallback to empty string if value is null/undefined
                            }
                        }
                    });

                    return selectedRow;
                });

                // Check if there's data to export
                if (exportData.length === 0) {
                    reject('No data available for export.');
                    return;
                }

                // Create and download Excel file
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Work Summary');
                XLSX.writeFile(workbook, 'DailyWorkSummary.xlsx');

                resolve('Export successful!');
                closeModal(); // Close modal after successful export

            } catch (error) {
                reject('Failed to export data. Please try again.');
                console.error("Error exporting data to Excel:", error); // Log the actual error for debugging
            }
        });

        showToast.promise(
            promise,
            {
                pending: {
                    render() {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Spinner size="sm" />
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

export default DailyWorkSummaryDownloadForm;
