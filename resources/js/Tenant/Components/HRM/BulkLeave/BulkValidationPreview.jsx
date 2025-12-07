import React from 'react';
import { 
    Card, 
    CardBody, 
    CardHeader, 
    Chip, 
    Spinner, 
    Divider, 
    Progress 
} from '@heroui/react';

import { 
    CheckCircleIcon, 
    ExclamationTriangleIcon, 
    XCircleIcon,
    InformationCircleIcon 
} from '@heroicons/react/24/outline';

// Theme utility function
const getThemeRadius = () => {
    if (typeof window === 'undefined') return 'lg';
    
    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    
    const radiusValue = parseInt(borderRadius);
    if (radiusValue === 0) return 'none';
    if (radiusValue <= 4) return 'sm';
    if (radiusValue <= 8) return 'md';
    if (radiusValue <= 12) return 'lg';
    return 'xl';
};

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
        const iconProps = { className: "w-4 h-4" };
        switch (status) {
            case 'valid':
                return (
                    <CheckCircleIcon 
                        {...iconProps} 
                        style={{ color: 'var(--theme-success, #22C55E)' }}
                    />
                );
            case 'warning':
                return (
                    <ExclamationTriangleIcon 
                        {...iconProps} 
                        style={{ color: 'var(--theme-warning, #F59E0B)' }}
                    />
                );
            case 'conflict':
                return (
                    <XCircleIcon 
                        {...iconProps} 
                        style={{ color: 'var(--theme-danger, #EF4444)' }}
                    />
                );
            default:
                return (
                    <InformationCircleIcon 
                        {...iconProps} 
                        style={{ color: 'var(--theme-foreground-400, #A1A1AA)' }}
                    />
                );
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
        <div className="flex flex-col gap-3 sm:gap-4">
            {/* Summary Card */}
            <Card 
                radius={getThemeRadius()}
                className="shadow-sm border border-divider/50"
                style={{
                    borderRadius: `var(--borderRadius, 12px)`,
                    fontFamily: `var(--fontFamily, "Inter")`,
                    background: `linear-gradient(135deg, 
                        color-mix(in srgb, var(--theme-content1) 90%, transparent) 40%, 
                        color-mix(in srgb, var(--theme-content2) 80%, transparent) 60%)`,
                }}
            >
                <CardHeader className="pb-2 px-4 pt-4">
                    <div className="flex items-center justify-between w-full">
                        <h3 className="text-base sm:text-lg font-semibold" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            Validation Results
                        </h3>
                        {isValidating && (
                            <div className="flex items-center gap-2">
                                <Spinner size="sm" color="primary" />
                                <span className="text-xs sm:text-sm" style={{
                                    color: `var(--theme-foreground-600, #71717A)`,
                                    fontFamily: `var(--fontFamily, "Inter")`,
                                }}>
                                    Validating...
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="pt-0 px-4 pb-4" style={{
                    fontFamily: `var(--fontFamily, "Inter")`,
                }}>
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="text-center">
                            <h4 className="text-lg sm:text-2xl font-bold" style={{
                                color: `var(--theme-success, #22C55E)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {validCount}
                            </h4>
                            <p className="text-xs sm:text-sm" style={{
                                color: `var(--theme-success, #22C55E)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Valid
                            </p>
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg sm:text-2xl font-bold" style={{
                                color: `var(--theme-warning, #F59E0B)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {warningCount}
                            </h4>
                            <p className="text-xs sm:text-sm" style={{
                                color: `var(--theme-warning, #F59E0B)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Warnings
                            </p>
                        </div>
                        <div className="text-center">
                            <h4 className="text-lg sm:text-2xl font-bold" style={{
                                color: `var(--theme-danger, #EF4444)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                {conflictCount}
                            </h4>
                            <p className="text-xs sm:text-sm" style={{
                                color: `var(--theme-danger, #EF4444)`,
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                Conflicts
                            </p>
                        </div>
                    </div>

                    {/* Balance Impact */}
                    {balanceImpact && (
                        <div className="p-3 sm:p-4 rounded-lg border" style={{
                            background: `var(--theme-content2, #F4F4F5)`,
                            borderColor: `var(--theme-divider, #E4E4E7)`,
                            borderRadius: `var(--borderRadius, 8px)`,
                        }}>
                            <h4 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 flex items-center gap-2" style={{
                                fontFamily: `var(--fontFamily, "Inter")`,
                            }}>
                                <InformationCircleIcon 
                                    className="w-4 h-4" 
                                    style={{ color: 'var(--theme-primary)' }}
                                />
                                Leave Balance Impact
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                                <div>
                                    <span className="text-xs sm:text-sm" style={{
                                        color: `var(--theme-foreground-600, #71717A)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Leave Type:
                                    </span>
                                    <span className="text-xs sm:text-sm font-medium ml-2" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {balanceImpact.leave_type}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs sm:text-sm" style={{
                                        color: `var(--theme-foreground-600, #71717A)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Current Balance:
                                    </span>
                                    <span className="text-xs sm:text-sm font-medium ml-2" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {balanceImpact.current_balance} days
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs sm:text-sm" style={{
                                        color: `var(--theme-foreground-600, #71717A)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Requested Days:
                                    </span>
                                    <span className="text-xs sm:text-sm font-medium ml-2" style={{
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {balanceImpact.requested_days} days
                                    </span>
                                </div>
                                <div>
                                    <span className="text-xs sm:text-sm" style={{
                                        color: `var(--theme-foreground-600, #71717A)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        Remaining Balance:
                                    </span>
                                    <span className={`text-xs sm:text-sm font-medium ml-2`} style={{
                                        color: balanceImpact.remaining_balance < 0 
                                            ? 'var(--theme-danger)' 
                                            : 'var(--theme-success)',
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
                                        {balanceImpact.remaining_balance} days
                                    </span>
                                </div>
                            </div>
                            
                            {balanceImpact.remaining_balance < 0 && (
                                <div className="mt-3 p-2 sm:p-3 rounded-md border" style={{
                                    background: `color-mix(in srgb, var(--theme-danger) 10%, transparent)`,
                                    borderColor: `color-mix(in srgb, var(--theme-danger) 20%, transparent)`,
                                    borderRadius: `var(--borderRadius, 8px)`,
                                }}>
                                    <p className="text-xs sm:text-sm" style={{
                                        color: `var(--theme-danger)`,
                                        fontFamily: `var(--fontFamily, "Inter")`,
                                    }}>
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
                <Card 
                    radius={getThemeRadius()}
                    className="shadow-sm border border-divider/50"
                    style={{
                        borderRadius: `var(--borderRadius, 12px)`,
                        fontFamily: `var(--fontFamily, "Inter")`,
                        background: `linear-gradient(135deg, 
                            color-mix(in srgb, var(--theme-content1) 90%, transparent) 40%, 
                            color-mix(in srgb, var(--theme-content2) 80%, transparent) 60%)`,
                    }}
                >
                    <CardHeader className="px-4 pt-4 pb-2">
                        <h3 className="text-base sm:text-lg font-semibold" style={{
                            fontFamily: `var(--fontFamily, "Inter")`,
                        }}>
                            Date-by-Date Results
                        </h3>
                    </CardHeader>
                    <CardBody className="px-4 pb-4 pt-0" style={{
                        fontFamily: `var(--fontFamily, "Inter")`,
                    }}>
                        <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                            {validationResults.map((result, index) => (
                                <div 
                                    key={index}
                                    className="flex items-start justify-between p-3 rounded-lg border transition-colors"
                                    style={{
                                        borderColor: `var(--theme-divider, #E4E4E7)`,
                                        borderRadius: `var(--borderRadius, 8px)`,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.borderColor = 'var(--theme-divider-hover, #D4D4D8)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.borderColor = 'var(--theme-divider, #E4E4E7)';
                                    }}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        {getStatusIcon(result.status)}
                                        <div>
                                            <p className="text-xs sm:text-sm font-medium" style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}>
                                                {formatDate(result.date)}
                                            </p>
                                            <p className="text-xs opacity-75" style={{
                                                color: `var(--theme-foreground-500, #71717A)`,
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}>
                                                {result.date}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        <Chip 
                                            size="sm" 
                                            variant="bordered" 
                                            color={getStatusColor(result.status)}
                                            radius={getThemeRadius()}
                                            className="capitalize text-xs"
                                            style={{
                                                fontFamily: `var(--fontFamily, "Inter")`,
                                            }}
                                        >
                                            {result.status}
                                        </Chip>
                                        
                                        {/* Errors */}
                                        {result.errors && result.errors.length > 0 && (
                                            <div className="text-right">
                                                {result.errors.map((error, errorIndex) => (
                                                    <p key={errorIndex} className="text-xs" style={{
                                                        color: `var(--theme-danger)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}>
                                                        {error}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Warnings */}
                                        {result.warnings && result.warnings.length > 0 && (
                                            <div className="text-right">
                                                {result.warnings.map((warning, warningIndex) => (
                                                    <p key={warningIndex} className="text-xs" style={{
                                                        color: `var(--theme-warning)`,
                                                        fontFamily: `var(--fontFamily, "Inter")`,
                                                    }}>
                                                        {warning}
                                                    </p>
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
