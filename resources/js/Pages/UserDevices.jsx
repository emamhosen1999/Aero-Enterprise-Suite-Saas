import React from 'react';
import { Head, Link } from "@inertiajs/react";
import { 
  Card,
  CardBody,
  CardHeader,
  Chip,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip
} from "@heroui/react";
import { 
  ArrowLeftIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  LockOpenIcon
} from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import { formatDistanceToNow } from 'date-fns';

const UserDevices = ({ user, devices }) => {
  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
      case 'tablet':
        return <DeviceTabletIcon className="w-5 h-5" />;
      default:
        return <ComputerDesktopIcon className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <App>
      <Head title={`Device History - ${user.name}`} />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={route('users')}>
              <Button
                variant="light"
                startContent={<ArrowLeftIcon className="w-4 h-4" />}
                className="mb-2"
              >
                Back to Users
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Device History</h1>
            <p className="text-default-500 mt-1">
              {user.name} ({user.email})
            </p>
          </div>
          
          <Chip
            color={user.single_device_login_enabled ? "success" : "default"}
            variant="flat"
            startContent={user.single_device_login_enabled ? 
              <LockClosedIcon className="w-4 h-4" /> : 
              <LockOpenIcon className="w-4 h-4" />
            }
          >
            {user.single_device_login_enabled ? 'Single Device Enforced' : 'Multiple Devices Allowed'}
          </Chip>
        </div>

        {/* Devices Table */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Registered Devices</h2>
              <p className="text-sm text-default-500">
                {devices.length} {devices.length === 1 ? 'device' : 'devices'} registered
              </p>
            </div>
          </CardHeader>
          <CardBody>
            {devices.length === 0 ? (
              <div className="text-center py-12">
                <DevicePhoneMobileIcon className="w-12 h-12 mx-auto text-default-300 mb-3" />
                <p className="text-default-500">No devices registered yet</p>
              </div>
            ) : (
              <Table aria-label="User devices table" removeWrapper>
                <TableHeader>
                  <TableColumn>DEVICE</TableColumn>
                  <TableColumn>TYPE</TableColumn>
                  <TableColumn>IP ADDRESS</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>LAST USED</TableColumn>
                  <TableColumn>REGISTERED</TableColumn>
                </TableHeader>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getDeviceIcon(device.device_type)}
                          <div>
                            <p className="font-medium">{device.device_name}</p>
                            <p className="text-xs text-default-500">{device.browser} on {device.platform}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {device.device_type || 'Unknown'}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{device.ip_address}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip content={device.is_active ? "Active" : "Inactive"}>
                            <Chip
                              size="sm"
                              color={device.is_active ? "success" : "default"}
                              variant="flat"
                              startContent={device.is_active ? 
                                <CheckCircleIcon className="w-3 h-3" /> : 
                                <XCircleIcon className="w-3 h-3" />
                              }
                            >
                              {device.is_active ? 'Active' : 'Inactive'}
                            </Chip>
                          </Tooltip>
                          {device.is_trusted && (
                            <Tooltip content="Trusted Device">
                              <Chip
                                size="sm"
                                color="primary"
                                variant="flat"
                                startContent={<ShieldCheckIcon className="w-3 h-3" />}
                              >
                                Trusted
                              </Chip>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-default-400" />
                          <span className="text-sm">{formatDate(device.last_used_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-500">
                          {formatDate(device.created_at)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Device Details */}
        {devices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <Card key={device.id} className="border-2 border-default-200">
                <CardBody>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.device_type)}
                      <span className="font-semibold">{device.device_name}</span>
                    </div>
                    {device.is_active && (
                      <Chip size="sm" color="success" variant="dot">
                        Active
                      </Chip>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-default-500">Device ID:</span>
                      <span className="font-mono text-xs">{device.device_id.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">IP Address:</span>
                      <span>{device.ip_address}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">Browser:</span>
                      <span>{device.browser}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">Platform:</span>
                      <span>{device.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500">Last Used:</span>
                      <span>{formatDate(device.last_used_at)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </App>
  );
};

export default UserDevices;
