import React from 'react';


import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    XCircleIcon,
    InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Chip, Progress } from '@heroui/react';

const BulkValidationPreview = ({ 
    validationResults = [], 
    balanceImpact = null,
    isValidating = false 
}) => {
    if (validationResults.length === 0 && !isValidating) {
        return null;
    }

    // Count validation statuses
    const validCount = validationResults.filter(r => r.status === 'valid').length;
    const warningCount = validationResults.filter(r => r.status === 'warning').length;
    const conflictCount = validationResults.filter(r => r.status === 'conflict').length;
    const totalCount = validationResults.length;

    // Get status icon and color
    const getStatusIcon = (status) => {
        switch (status) {
            case 'valid':
                return <CheckCircleIcon className="w-4 h-4 text-success" />;
            case 'warning':
                return <ExclamationTriangleIcon className="w-4 h-4 text-warning" />;
            case 'conflict':
                return <XCircleIcon className="w-4 h-4 text-danger" />;
            default:
                return <InformationCircleIcon className="w-4 h-4 text-default-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'valid':
                return 'success';
            case 'warning':
                return 'warning';
            case 'conflict':
                return 'danger';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-4">
            {/* Summary Card */}
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between w-full">
                        <h4 className="text-lg font-semibold">Validation Results</h4>
                        {isValidating && (
                            <div className="flex items-center gap-2">
                                <Progress size="sm" isIndeterminate className="w-20" />
                                <span className="text-sm text-default-500">Validating...</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="pt-0">
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-success">{validCount}</div>
                            <div className="text-sm text-success">Valid</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-warning">{warningCount}</div>
                            <div className="text-sm text-warning">Warnings</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-danger">{conflictCount}</div>
                            <div className="text-sm text-danger">Conflicts</div>
                        </div>
                    </div>

                    {/* Balance Impact */}
                    {balanceImpact && (
                        <div className="p-3 rounded-lg bg-default-100 border">
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                                <InformationCircleIcon className="w-4 h-4 text-primary" />
                                Leave Balance Impact
                            </h5>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-default-600">Leave Type:</span>
                                    <span className="ml-2 font-medium">{balanceImpact.leave_type}</span>
                                </div>
                                <div>
                                    <span className="text-default-600">Current Balance:</span>
                                    <span className="ml-2 font-medium">{balanceImpact.current_balance} days</span>
                                </div>
                                <div>
                                    <span className="text-default-600">Requested Days:</span>
                                    <span className="ml-2 font-medium">{balanceImpact.requested_days} days</span>
                                </div>
                                <div>
                                    <span className="text-default-600">Remaining Balance:</span>
                                    <span className={`ml-2 font-medium ${balanceImpact.remaining_balance < 0 ? 'text-danger' : 'text-success'}`}>
                                        {balanceImpact.remaining_balance} days
                                    </span>
                                </div>
                            </div>
                            
                            {balanceImpact.remaining_balance < 0 && (
                                <div className="mt-2 p-2 rounded-sm bg-danger/10 border border-danger/20">
                                    <p className="text-sm text-danger">
                                        ⚠️ This request exceeds your available leave balance by {Math.abs(balanceImpact.remaining_balance)} days.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Detailed Results */}
            {validationResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <h4 className="text-lg font-semibold">Date-by-Date Results</h4>
                    </CardHeader>
                    <CardBody>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {validationResults.map((result, index) => (
                                <div 
                                    key={index}
                                    className="flex items-start justify-between p-3 rounded-lg border border-default-200 hover:border-default-300 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(result.status)}
                                        <div>
                                            <div className="font-medium">{formatDate(result.date)}</div>
                                            <div className="text-sm text-default-600">{result.date}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <Chip 
                                            size="sm" 
                                            variant="flat" 
                                            color={getStatusColor(result.status)}
                                        >
                                            {result.status}
                                        </Chip>
                                        
                                        {/* Errors */}
                                        {result.errors && result.errors.length > 0 && (
                                            <div className="text-right">
                                                {result.errors.map((error, errorIndex) => (
                                                    <div key={errorIndex} className="text-xs text-danger">
                                                        {error}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Warnings */}
                                        {result.warnings && result.warnings.length > 0 && (
                                            <div className="text-right">
                                                {result.warnings.map((warning, warningIndex) => (
                                                    <div key={warningIndex} className="text-xs text-warning">
                                                        {warning}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default BulkValidationPreview;
