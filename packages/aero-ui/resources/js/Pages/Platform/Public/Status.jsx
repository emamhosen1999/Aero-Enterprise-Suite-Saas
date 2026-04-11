import React, { useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Divider,
} from '@heroui/react';
import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Status = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    divider: isDarkMode ? 'border-white/10' : 'border-slate-200',
    buttonPrimary: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold',
    buttonBorder: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
  }), [isDarkMode]);

  const services = [
    { name: 'Employee Workspace', status: 'operational', uptime: '99.99%' },
    { name: 'Connected Services', status: 'operational', uptime: '99.98%' },
    { name: 'Sign-in & Access', status: 'operational', uptime: '100%' },
    { name: 'Business Records', status: 'operational', uptime: '99.99%' },
    { name: 'Document Access', status: 'operational', uptime: '99.97%' },
    { name: 'Email Delivery', status: 'operational', uptime: '99.95%' },
    { name: 'Scheduled Workflows', status: 'operational', uptime: '99.99%' },
    { name: 'Partner Connections', status: 'operational', uptime: '99.96%' },
  ];

  const recentIncidents = [
    {
      date: 'No recent service notices',
      title: 'All services running normally',
      status: 'resolved',
      description: 'No major service notices shared in the last 90 days.',
    },
  ];

  const scheduledMaintenance = [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'degraded':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning" />;
      case 'outage':
        return <XCircleIcon className="w-5 h-5 text-danger" />;
      case 'maintenance':
        return <ClockIcon className="w-5 h-5 text-primary" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
    }
  };

  const getStatusChip = (status) => {
    const statusMap = {
      operational: { color: 'success', label: 'Operational' },
      degraded: { color: 'warning', label: 'Degraded' },
      outage: { color: 'danger', label: 'Outage' },
      maintenance: { color: 'primary', label: 'Maintenance' },
      resolved: { color: 'success', label: 'Resolved' },
    };
    const { color, label } = statusMap[status] || statusMap.operational;
    return <Chip color={color} size="sm" variant="flat">{label}</Chip>;
  };

  const allOperational = services.every(s => s.status === 'operational');

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Service Status" />
      <div className={palette.baseText}>
        {/* Hero Section */}
        <section className="relative overflow-hidden text-center">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-emerald-600/20 via-blue-600/15 to-cyan-500/20'
                  : 'bg-gradient-to-br from-emerald-50 via-blue-50 to-cyan-100/60'
              }`}
            />
            <div className="absolute -right-20 top-8 w-72 h-72 bg-emerald-500/25 blur-[140px]" />
            <div className="absolute -left-16 bottom-0 w-72 h-72 bg-blue-400/25 blur-[140px]" />
          </div>
          <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16">
            <Chip color={allOperational ? 'success' : 'warning'} variant="flat" className="uppercase tracking-[0.3em] text-[10px] md:text-xs">
              {allOperational ? 'Service Normal' : 'Service Update'}
            </Chip>
            <h1 className="text-2xl md:text-5xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
              Service Update Center
            </h1>
            <p className={`${palette.mutedText} max-w-3xl mx-auto text-sm md:text-base`}>
              Stay informed about service availability, planned updates, and customer notices with clear and timely communication.
            </p>
          </div>
        </section>

        {/* Current Status Overview */}
        <section className="px-4 md:px-6 pb-8 md:pb-12">
          <div className="max-w-4xl mx-auto">
            <Card className={`${palette.card} ${allOperational ? 'border-success/30' : ''}`}>
              <CardBody className="p-6">
                <div className="flex items-center gap-4">
                  {allOperational ? (
                    <CheckCircleIcon className="w-12 h-12 text-success" />
                  ) : (
                    <ExclamationTriangleIcon className="w-12 h-12 text-warning" />
                  )}
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold">
                      {allOperational ? 'All services are running as expected' : 'Some services currently need attention'}
                    </h2>
                    <p className={`${palette.mutedText} text-sm`}>
                      Last updated: {new Date().toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Service Status Grid */}
        <section className={`px-4 md:px-6 py-8 md:py-12 ${palette.tint}`}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-3xl font-semibold">Service Overview</h2>
              <p className={`${palette.mutedText} mt-2 text-sm md:text-base`}>
                Current availability across customer-facing services
              </p>
            </div>
            <Card className={palette.card}>
              <CardBody className="p-0">
                {services.map((service, index) => (
                  <div key={service.name}>
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service.status)}
                        <span className="font-medium">{service.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm ${palette.mutedText} hidden sm:inline`}>
                          {service.uptime} uptime
                        </span>
                        {getStatusChip(service.status)}
                      </div>
                    </div>
                    {index < services.length - 1 && <Divider className={palette.divider} />}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Scheduled Maintenance */}
        <section className="px-4 md:px-6 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-3xl font-semibold">Scheduled Maintenance</h2>
              <p className={`${palette.mutedText} mt-2 text-sm md:text-base`}>
                Upcoming planned maintenance windows
              </p>
            </div>
            <Card className={palette.card}>
              <CardBody className="p-6 text-center">
                {scheduledMaintenance.length === 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <ClockIcon className={`w-12 h-12 ${palette.mutedText}`} />
                      <p className={palette.mutedText}>No planned maintenance at this time.</p>
                  </div>
                ) : (
                  scheduledMaintenance.map((item, index) => (
                    <div key={index} className="text-left">
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className={`text-sm ${palette.mutedText}`}>{item.date}</p>
                      <p className="mt-2">{item.description}</p>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Recent Incidents */}
        <section className={`px-4 md:px-6 py-8 md:py-12 ${palette.tint}`}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-3xl font-semibold">Service Notice History</h2>
              <p className={`${palette.mutedText} mt-2 text-sm md:text-base`}>
                Notices shared in the last 90 days
              </p>
            </div>
            <Card className={palette.card}>
              <CardBody className="p-6">
                {recentIncidents.map((incident, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <CheckCircleIcon className="w-6 h-6 text-success shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{incident.title}</h3>
                        {getStatusChip(incident.status)}
                      </div>
                      <p className={`text-sm ${palette.mutedText} mt-1`}>{incident.date}</p>
                      <p className={`${palette.mutedText} mt-2`}>{incident.description}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Uptime Stats */}
        <section className="px-4 md:px-6 py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={palette.card}>
                <CardBody className="text-center p-4">
                  <p className="text-2xl md:text-3xl font-bold text-success">99.99%</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText} mt-1`}>Overall Uptime</p>
                </CardBody>
              </Card>
              <Card className={palette.card}>
                <CardBody className="text-center p-4">
                  <p className="text-2xl md:text-3xl font-bold">0</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText} mt-1`}>Service Notices (90d)</p>
                </CardBody>
              </Card>
              <Card className={palette.card}>
                <CardBody className="text-center p-4">
                  <p className="text-2xl md:text-3xl font-bold">&lt;50ms</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText} mt-1`}>Average Service Speed</p>
                </CardBody>
              </Card>
              <Card className={palette.card}>
                <CardBody className="text-center p-4">
                  <p className="text-2xl md:text-3xl font-bold">24/7</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText} mt-1`}>Active Service Oversight</p>
                </CardBody>
              </Card>
            </div>
          </div>
        </section>

        {/* Subscribe Section */}
        <section className={`px-4 md:px-6 py-8 md:py-12 ${palette.tint}`}>
          <div className="max-w-4xl mx-auto">
            <Card className={palette.card}>
              <CardBody className="p-6 text-center">
                <h3 className="text-xl md:text-2xl font-semibold">Subscribe to Service Updates</h3>
                <p className={`${palette.mutedText} mt-2 mb-4`}>
                  Receive timely updates on service notices and planned maintenance windows by email.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button as={Link} href={route('platform.support')} className={palette.buttonPrimary}>
                    Contact Support
                  </Button>
                  <Button as={Link} href={route('platform.docs')} variant="bordered" className={palette.buttonBorder}>
                    View Trust Resources
                  </Button>
                  <Button as={Link} href={route('platform.standalone')} variant="bordered" className={palette.buttonBorder}>
                    Private setup support
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
};

export default Status;
