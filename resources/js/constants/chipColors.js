/**
 * Standardized chip colors and states for consistent UI across the application
 * These colors work with both HeroUI and Material-UI chip components
 */

// Leave status chip colors
export const LEAVE_STATUS_COLORS = {
    'pending': {
        color: 'warning',
        heroUIColor: 'warning',
        muiColor: 'warning',
        icon: '⏳',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        textColor: '#d97706',
        description: 'Awaiting approval'
    },
    'approved': {
        color: 'success',
        heroUIColor: 'success',
        muiColor: 'success',
        icon: '✅',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        textColor: '#16a34a',
        description: 'Approved and active'
    },
    'rejected': {
        color: 'danger',
        heroUIColor: 'danger',
        muiColor: 'error',
        icon: '❌',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        textColor: '#dc2626',
        description: 'Rejected by manager'
    },
    'cancelled': {
        color: 'default',
        heroUIColor: 'default',
        muiColor: 'default',
        icon: '⚪',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        textColor: '#6b7280',
        description: 'Cancelled by employee'
    }
};

// Holiday type chip colors
export const HOLIDAY_TYPE_COLORS = {
    'public': {
        color: 'danger',
        heroUIColor: 'danger',
        muiColor: 'error',
        icon: '🏛️',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        textColor: '#dc2626',
        description: 'Public holiday'
    },
    'religious': {
        color: 'secondary',
        heroUIColor: 'secondary',
        muiColor: 'secondary',
        icon: '🕌',
        bgColor: 'rgba(168, 85, 247, 0.1)',
        textColor: '#7c3aed',
        description: 'Religious holiday'
    },
    'national': {
        color: 'primary',
        heroUIColor: 'primary',
        muiColor: 'primary',
        icon: '🇧🇩',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        textColor: '#2563eb',
        description: 'National holiday'
    },
    'company': {
        color: 'warning',
        heroUIColor: 'warning',
        muiColor: 'warning',
        icon: '🏢',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        textColor: '#d97706',
        description: 'Company holiday'
    },
    'optional': {
        color: 'default',
        heroUIColor: 'default',
        muiColor: 'default',
        icon: '📅',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        textColor: '#6b7280',
        description: 'Optional holiday'
    }
};

// Holiday status chip colors
export const HOLIDAY_STATUS_COLORS = {
    'upcoming': {
        color: 'primary',
        heroUIColor: 'primary',
        muiColor: 'primary',
        icon: '⏰',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        textColor: '#2563eb',
        description: 'Upcoming holiday'
    },
    'ongoing': {
        color: 'success',
        heroUIColor: 'success',
        muiColor: 'success',
        icon: '🟢',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        textColor: '#16a34a',
        description: 'Holiday in progress'
    },
    'past': {
        color: 'default',
        heroUIColor: 'default',
        muiColor: 'default',
        icon: '⚪',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        textColor: '#6b7280',
        description: 'Past holiday'
    }
};

// Calendar date state colors (for bulk calendar component)
export const CALENDAR_DATE_COLORS = {
    'selected': {
        color: 'primary',
        heroUIColor: 'primary',
        muiColor: 'primary',
        bgColor: 'rgba(59, 130, 246, 1)',
        textColor: '#ffffff',
        borderColor: '#1d4ed8',
        description: 'Selected date'
    },
    'existing_leave': {
        color: 'danger',
        heroUIColor: 'danger',
        muiColor: 'error',
        bgColor: 'rgba(239, 68, 68, 0.2)',
        textColor: '#dc2626',
        borderColor: '#dc2626',
        indicatorColor: '#dc2626',
        description: 'Has existing leave'
    },
    'holiday': {
        color: 'warning',
        heroUIColor: 'warning',
        muiColor: 'warning',
        bgColor: 'rgba(245, 158, 11, 0.2)',
        textColor: '#d97706',
        borderColor: '#d97706',
        indicatorColor: '#d97706',
        description: 'Public holiday'
    },
    'today': {
        color: 'secondary',
        heroUIColor: 'secondary',
        muiColor: 'secondary',
        bgColor: 'rgba(168, 85, 247, 0.1)',
        textColor: '#7c3aed',
        borderColor: '#7c3aed',
        description: 'Today'
    },
    'weekend': {
        color: 'default',
        heroUIColor: 'default',
        muiColor: 'default',
        bgColor: 'transparent',
        textColor: '#9ca3af',
        description: 'Weekend'
    },
    'disabled': {
        color: 'default',
        heroUIColor: 'default',
        muiColor: 'default',
        bgColor: 'rgba(107, 114, 128, 0.05)',
        textColor: '#d1d5db',
        description: 'Not selectable'
    }
};

// User status chip colors
export const USER_STATUS_COLORS = {
    'active': {
        color: 'success',
        heroUIColor: 'success',
        muiColor: 'success',
        icon: '✅',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        textColor: '#16a34a',
        description: 'Active user'
    },
    'inactive': {
        color: 'danger',
        heroUIColor: 'danger',
        muiColor: 'error',
        icon: '❌',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        textColor: '#dc2626',
        description: 'Inactive user'
    },
    'suspended': {
        color: 'warning',
        heroUIColor: 'warning',
        muiColor: 'warning',
        icon: '⚠️',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        textColor: '#d97706',
        description: 'Suspended user'
    }
};

// Validation result colors (for bulk leave validation)
export const VALIDATION_RESULT_COLORS = {
    'valid': {
        color: 'success',
        heroUIColor: 'success',
        muiColor: 'success',
        icon: '✅',
        bgColor: 'rgba(34, 197, 94, 0.1)',
        textColor: '#16a34a',
        description: 'Valid date'
    },
    'warning': {
        color: 'warning',
        heroUIColor: 'warning',
        muiColor: 'warning',
        icon: '⚠️',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        textColor: '#d97706',
        description: 'Warning - check carefully'
    },
    'conflict': {
        color: 'danger',
        heroUIColor: 'danger',
        muiColor: 'error',
        icon: '❌',
        bgColor: 'rgba(239, 68, 68, 0.1)',
        textColor: '#dc2626',
        description: 'Conflict detected'
    },
    'info': {
        color: 'primary',
        heroUIColor: 'primary',
        muiColor: 'primary',
        icon: 'ℹ️',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        textColor: '#2563eb',
        description: 'Information'
    }
};

// Helper functions to get colors
export const getLeaveStatusColor = (status) => {
    return LEAVE_STATUS_COLORS[status?.toLowerCase()] || LEAVE_STATUS_COLORS['pending'];
};

export const getHolidayTypeColor = (type) => {
    return HOLIDAY_TYPE_COLORS[type?.toLowerCase()] || HOLIDAY_TYPE_COLORS['public'];
};

export const getHolidayStatusColor = (status) => {
    return HOLIDAY_STATUS_COLORS[status?.toLowerCase()] || HOLIDAY_STATUS_COLORS['upcoming'];
};

export const getCalendarDateColor = (state) => {
    return CALENDAR_DATE_COLORS[state?.toLowerCase()] || CALENDAR_DATE_COLORS['disabled'];
};

export const getUserStatusColor = (status) => {
    return USER_STATUS_COLORS[status?.toLowerCase()] || USER_STATUS_COLORS['active'];
};

export const getValidationResultColor = (result) => {
    return VALIDATION_RESULT_COLORS[result?.toLowerCase()] || VALIDATION_RESULT_COLORS['info'];
};

// Export all colors for external access
export const ALL_CHIP_COLORS = {
    LEAVE_STATUS_COLORS,
    HOLIDAY_TYPE_COLORS,
    HOLIDAY_STATUS_COLORS,
    CALENDAR_DATE_COLORS,
    USER_STATUS_COLORS,
    VALIDATION_RESULT_COLORS
};

export default ALL_CHIP_COLORS;
