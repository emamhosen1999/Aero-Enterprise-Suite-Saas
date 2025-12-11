const hrmNavigation = [
  {
    name: "HRM",
    icon: "UserGroupIcon",
    order: 100,
    access_key: "hrm",
    children: [
      {
        name: "HR Dashboard",
        href: "/tenant/hr/dashboard",
        icon: "ChartBarSquareIcon",
        active_rule: "hr.dashboard",
        access_key: "hrm.dashboard"
      },
      // Employees
      {
        name: "Employees",
        icon: "UsersIcon",
        access_key: "hrm.employees",
        children: [
          {
            name: "Employee Directory",
            href: "/tenant/hr/employees",
            active_rule: "employees.index",
            access_key: "hrm.employees.employee-directory"
          },
          {
            name: "Employee Profile",
            href: "/tenant/hr/employees/profile",
            active_rule: "employees.profile",
            access_key: "hrm.employees.employee-profile"
          },
          {
            name: "Departments",
            href: "/tenant/hr/departments",
            active_rule: "departments.index",
            access_key: "hrm.employees.departments"
          },
          {
            name: "Designations",
            href: "/tenant/hr/designations",
            active_rule: "designations.index",
            access_key: "hrm.employees.designations"
          },
          {
            name: "Documents",
            href: "/tenant/hr/employees/documents",
            active_rule: "employees.documents",
            access_key: "hrm.employees.employee-documents"
          },
          {
            name: "Onboarding",
            href: "/tenant/hr/onboarding",
            active_rule: "onboarding.index",
            access_key: "hrm.employees.onboarding-wizard"
          },
          {
            name: "Exit/Termination",
            href: "/tenant/hr/offboarding",
            active_rule: "offboarding.index",
            access_key: "hrm.employees.exit-termination"
          },
          {
            name: "Custom Fields",
            href: "/tenant/hr/employees/custom-fields",
            active_rule: "employees.custom-fields",
            access_key: "hrm.employees.custom-fields"
          }
        ]
      },
      // Attendance
      {
        name: "Attendance",
        icon: "ClockIcon",
        access_key: "hrm.attendance",
        children: [
          {
            name: "Daily Attendance",
            href: "/tenant/hr/attendance/daily",
            active_rule: "attendance.daily",
            access_key: "hrm.attendance.daily-attendance"
          },
          {
            name: "Monthly Calendar",
            href: "/tenant/hr/attendance/calendar",
            active_rule: "attendance.calendar",
            access_key: "hrm.attendance.monthly-calendar"
          },
          {
            name: "Attendance Logs",
            href: "/tenant/hr/attendance/logs",
            active_rule: "attendance.logs",
            access_key: "hrm.attendance.attendance-logs"
          },
          {
            name: "Shift Scheduling",
            href: "/tenant/hr/shifts",
            active_rule: "shifts.index",
            access_key: "hrm.attendance.shift-scheduling"
          },
          {
            name: "Adjustment Requests",
            href: "/tenant/hr/attendance/adjustments",
            active_rule: "attendance.adjustments",
            access_key: "hrm.attendance.adjustment-requests"
          },
          {
            name: "Device/IP/Geo Rules",
            href: "/tenant/hr/attendance/rules",
            active_rule: "attendance.rules",
            access_key: "hrm.attendance.device-rules"
          },
          {
            name: "Overtime Rules",
            href: "/tenant/hr/overtime/rules",
            active_rule: "overtime.rules",
            access_key: "hrm.attendance.overtime-rules"
          },
          {
            name: "My Attendance",
            href: "/tenant/hr/my-attendance",
            active_rule: "my-attendance",
            access_key: "hrm.attendance.my-attendance"
          }
        ]
      },
      // Leave Management
      {
        name: "Leave Management",
        icon: "CalendarIcon",
        access_key: "hrm.leaves",
        children: [
          {
            name: "Leave Types",
            href: "/tenant/hr/leaves/types",
            active_rule: "leaves.types",
            access_key: "hrm.leaves.leave-types"
          },
          {
            name: "Leave Balances",
            href: "/tenant/hr/leaves/balances",
            active_rule: "leaves.balances",
            access_key: "hrm.leaves.leave-balances"
          },
          {
            name: "Leave Requests",
            href: "/tenant/hr/leaves/requests",
            active_rule: "leaves.requests",
            access_key: "hrm.leaves.leave-requests"
          },
          {
            name: "Holiday Calendar",
            href: "/tenant/hr/holidays",
            active_rule: "holidays.index",
            access_key: "hrm.leaves.holiday-calendar"
          },
          {
            name: "Leave Policies",
            href: "/tenant/hr/leaves/policies",
            active_rule: "leaves.policies",
            access_key: "hrm.leaves.leave-policies"
          },
          {
            name: "Leave Accrual",
            href: "/tenant/hr/leaves/accrual",
            active_rule: "leaves.accrual",
            access_key: "hrm.leaves.leave-accrual"
          }
        ]
      },
      // Payroll
      {
        name: "Payroll",
        icon: "CurrencyDollarIcon",
        access_key: "hrm.payroll",
        children: [
          {
            name: "Salary Structures",
            href: "/tenant/hr/payroll/structures",
            active_rule: "payroll.structures",
            access_key: "hrm.payroll.salary-structures"
          },
          {
            name: "Salary Components",
            href: "/tenant/hr/payroll/components",
            active_rule: "payroll.components",
            access_key: "hrm.payroll.salary-components"
          },
          {
            name: "Payroll Run",
            href: "/tenant/hr/payroll/run",
            active_rule: "payroll.run",
            access_key: "hrm.payroll.payroll-run"
          },
          {
            name: "Payslips",
            href: "/tenant/hr/payroll/payslips",
            active_rule: "payroll.payslips",
            access_key: "hrm.payroll.payslips"
          },
          {
            name: "Tax Setup",
            href: "/tenant/hr/payroll/tax",
            active_rule: "payroll.tax",
            access_key: "hrm.payroll.tax-setup"
          },
          {
            name: "Loans & Advances",
            href: "/tenant/hr/payroll/loans",
            active_rule: "payroll.loans",
            access_key: "hrm.payroll.loans"
          },
          {
            name: "Bank File Generator",
            href: "/tenant/hr/payroll/bank-file",
            active_rule: "payroll.bank-file",
            access_key: "hrm.payroll.bank-file"
          }
        ]
      },
      // Recruitment
      {
        name: "Recruitment",
        icon: "BriefcaseIcon",
        access_key: "hrm.recruitment",
        children: [
          {
            name: "Job Openings",
            href: "/tenant/hr/recruitment/jobs",
            active_rule: "recruitment.jobs",
            access_key: "hrm.recruitment.job-openings"
          },
          {
            name: "Applicants",
            href: "/tenant/hr/recruitment/applicants",
            active_rule: "recruitment.applicants",
            access_key: "hrm.recruitment.applicants"
          },
          {
            name: "Candidate Pipeline",
            href: "/tenant/hr/recruitment/pipeline",
            active_rule: "recruitment.pipeline",
            access_key: "hrm.recruitment.candidate-pipeline"
          },
          {
            name: "Interview Scheduling",
            href: "/tenant/hr/recruitment/interviews",
            active_rule: "recruitment.interviews",
            access_key: "hrm.recruitment.interview-scheduling"
          },
          {
            name: "Evaluation Scores",
            href: "/tenant/hr/recruitment/evaluations",
            active_rule: "recruitment.evaluations",
            access_key: "hrm.recruitment.evaluation-scores"
          },
          {
            name: "Offer Letters",
            href: "/tenant/hr/recruitment/offers",
            active_rule: "recruitment.offers",
            access_key: "hrm.recruitment.offer-letters"
          },
          {
            name: "Job Portal Settings",
            href: "/tenant/hr/recruitment/portal",
            active_rule: "recruitment.portal",
            access_key: "hrm.recruitment.portal-settings"
          }
        ]
      },
      // Performance Management
      {
        name: "Performance",
        icon: "ChartBarSquareIcon",
        access_key: "hrm.performance",
        children: [
          {
            name: "KPI Setup",
            href: "/tenant/hr/performance/kpis",
            active_rule: "performance.kpis",
            access_key: "hrm.performance.kpi-setup"
          },
          {
            name: "Appraisal Cycles",
            href: "/tenant/hr/performance/appraisals",
            active_rule: "performance.appraisals",
            access_key: "hrm.performance.appraisal-cycles"
          },
          {
            name: "360° Reviews",
            href: "/tenant/hr/performance/360-reviews",
            active_rule: "performance.360-reviews",
            access_key: "hrm.performance.reviews-360"
          },
          {
            name: "Score Aggregation",
            href: "/tenant/hr/performance/scores",
            active_rule: "performance.scores",
            access_key: "hrm.performance.score-aggregation"
          },
          {
            name: "Promotion Recommendations",
            href: "/tenant/hr/performance/promotions",
            active_rule: "performance.promotions",
            access_key: "hrm.performance.promotion-recommendations"
          },
          {
            name: "Performance Reports",
            href: "/tenant/hr/performance/reports",
            active_rule: "performance.reports",
            access_key: "hrm.performance.performance-reports"
          }
        ]
      },
      // Training & Development
      {
        name: "Training",
        icon: "AcademicCapIcon",
        access_key: "hrm.training",
        children: [
          {
            name: "Training Programs",
            href: "/tenant/hr/training/programs",
            active_rule: "training.programs",
            access_key: "hrm.training.training-programs"
          },
          {
            name: "Training Sessions",
            href: "/tenant/hr/training/sessions",
            active_rule: "training.sessions",
            access_key: "hrm.training.training-sessions"
          },
          {
            name: "Trainers",
            href: "/tenant/hr/training/trainers",
            active_rule: "training.trainers",
            access_key: "hrm.training.trainers"
          },
          {
            name: "Enrollment",
            href: "/tenant/hr/training/enrollment",
            active_rule: "training.enrollment",
            access_key: "hrm.training.enrollment"
          },
          {
            name: "Training Attendance",
            href: "/tenant/hr/training/attendance",
            active_rule: "training.attendance",
            access_key: "hrm.training.training-attendance"
          },
          {
            name: "Certifications",
            href: "/tenant/hr/training/certifications",
            active_rule: "training.certifications",
            access_key: "hrm.training.certifications"
          }
        ]
      },
      // HR Analytics
      {
        name: "HR Analytics",
        icon: "ChartPieIcon",
        access_key: "hrm.hr-analytics",
        children: [
          {
            name: "Workforce Overview",
            href: "/tenant/hr/analytics/workforce",
            active_rule: "analytics.workforce",
            access_key: "hrm.hr-analytics.workforce-overview"
          },
          {
            name: "Turnover Analytics",
            href: "/tenant/hr/analytics/turnover",
            active_rule: "analytics.turnover",
            access_key: "hrm.hr-analytics.turnover-analytics"
          },
          {
            name: "Attendance Insights",
            href: "/tenant/hr/analytics/attendance",
            active_rule: "analytics.attendance",
            access_key: "hrm.hr-analytics.attendance-insights"
          },
          {
            name: "Payroll Cost Analysis",
            href: "/tenant/hr/analytics/payroll",
            active_rule: "analytics.payroll",
            access_key: "hrm.hr-analytics.payroll-cost-analysis"
          },
          {
            name: "Recruitment Funnel",
            href: "/tenant/hr/analytics/recruitment",
            active_rule: "analytics.recruitment",
            access_key: "hrm.hr-analytics.recruitment-funnel"
          },
          {
            name: "Performance Insights",
            href: "/tenant/hr/analytics/performance",
            active_rule: "analytics.performance",
            access_key: "hrm.hr-analytics.performance-insights"
          }
        ]
      }
    ]
  }
];
const Pages = {};
if (typeof window !== "undefined" && window.Aero && window.Aero.registerNavigation) {
  window.Aero.registerNavigation("hrm", hrmNavigation);
}
function resolve(path) {
  console.warn(`HRM Module: Page resolution not yet implemented for path: ${path}`);
  return null;
}
const index = {
  Pages,
  resolve
};
if (typeof window !== "undefined" && window.Aero) {
  console.log("[Aero HRM] Module loaded, registering with window.Aero");
  if (typeof window.Aero.register === "function") {
    window.Aero.register("Hrm", { Pages, resolve });
  } else {
    window.Aero.modules.Hrm = { Pages, resolve };
  }
  console.log("[Aero HRM] Module registered successfully");
}
export {
  Pages,
  index as default,
  resolve
};
//# sourceMappingURL=aero-hrm.js.map
