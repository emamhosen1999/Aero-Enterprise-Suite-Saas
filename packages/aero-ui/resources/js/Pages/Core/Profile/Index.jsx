import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Button } from '@heroui/react';
import App from '@/Layouts/App.jsx';
import { ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { useHRMAC } from '@/Hooks/useHRMAC';

const ProfileIndex = ({ title = 'My Profile', user }) => {
  const { hasAccess, isSuperAdmin } = useHRMAC();
  
  // Permissions using HRMAC
  // TODO: Update with correct HRMAC path once module hierarchy is defined for Core
  const canViewProfile = hasAccess('core.profile') || isSuperAdmin();
  const canAccessSecurity = hasAccess('core.profile.security') || isSuperAdmin();
  
  const userName = user?.name || 'User';
  return (
    <App>
      <Head title={title} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
            <UserIcon className="w-7 h-7 text-primary" />
            {userName}
          </h1>
          <p className="text-default-500">Manage your account and security settings.</p>
        </div>

        <Card className="aero-card">
          <CardHeader className="border-b border-divider flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-primary" />
              <div>
                <p className="text-sm text-default-500">Security</p>
                <h2 className="text-lg font-semibold">Protect your account</h2>
              </div>
            </div>
            <Button
              as={Link}
              href={route('core.profile.security')}
              color="primary"
              variant="shadow"
              size="sm"
            >
              Open Security
            </Button>
          </CardHeader>
          <CardBody className="space-y-3 text-default-600">
            <p>Review active sessions, trusted devices, and two-factor authentication.</p>
            <p className="text-default-500 text-sm">This page is a lightweight entry point; detailed controls live in Security.</p>
          </CardBody>
        </Card>
      </div>
    </App>
  );
};

export default ProfileIndex;
