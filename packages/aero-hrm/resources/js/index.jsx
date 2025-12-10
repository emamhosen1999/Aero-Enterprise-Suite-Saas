/**
 * Aero HRM Module Entry Point
 * 
 * This file exports all pages and components for the HRM module,
 * enabling dynamic loading in both SaaS and Standalone modes.
 */

// Import all pages
import EmployeeIndex from './Pages/Employees/Index';
import EmployeeCreate from './Pages/Employees/Create';
import EmployeeEdit from './Pages/Employees/Edit';
import AttendanceIndex from './Pages/Attendance/Index';
import AttendanceReport from './Pages/Attendance/Report';
import LeaveIndex from './Pages/Leave/Index';
import LeaveRequest from './Pages/Leave/Request';
import PayrollIndex from './Pages/Payroll/Index';
import PayrollProcess from './Pages/Payroll/Process';
// Import navigation definition
import {hrmNavigation} from './navigation';

// Export pages structure
export const Pages = {
  Employees: {
    Index: EmployeeIndex,
    Create: EmployeeCreate,
    Edit: EmployeeEdit,
  },
  Attendance: {
    Index: AttendanceIndex,
    Report: AttendanceReport,
  },
  Leave: {
    Index: LeaveIndex,
    Request: LeaveRequest,
  },
  Payroll: {
    Index: PayrollIndex,
    Process: PayrollProcess,
  },
};

// Register navigation with Core at module load time
if (typeof window !== 'undefined' && window.Aero && window.Aero.registerNavigation) {
  window.Aero.registerNavigation('hrm', hrmNavigation);
}

// Resolver function for dynamic component loading
export function resolve(path) {
  const parts = path.split('/');
  let component = Pages;

  for (const part of parts) {
    component = component[part];
    if (!component) {
      throw new Error(`Component not found: ${path}`);
    }
  }

  return component;
}

// Default export for UMD builds
export default {
  Pages,
  resolve,
};

// Auto-register with Aero if in browser environment
if (typeof window !== 'undefined' && window.Aero) {
  console.log('[Aero HRM] Module loaded, registering with window.Aero');
  
  // Register using the new API
  if (typeof window.Aero.register === 'function') {
    window.Aero.register('Hrm', { Pages, resolve });
  } else {
    // Fallback for older API
    window.Aero.modules.Hrm = { Pages, resolve };
  }
  
  console.log('[Aero HRM] Module registered successfully');
}
