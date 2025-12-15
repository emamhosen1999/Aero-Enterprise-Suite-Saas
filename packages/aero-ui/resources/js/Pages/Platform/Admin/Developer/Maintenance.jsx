import React, { useState, useCallback } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import App from '@/Layouts/App';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Textarea,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Tooltip,
  Divider,
} from '@heroui/react';
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ShieldExclamationIcon,
  ClockIcon,
  GlobeAltIcon,
  KeyIcon,
  ServerStackIcon,
  UserPlusIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { showToast } from '@/utils/toastUtils.jsx';

// Consistent styling from existing admin pages
const mainCardStyle = {
  border: `var(--borderWidth, 2px) solid transparent`,
  borderRadius: `var(--borderRadius, 12px)`,
  fontFamily: `var(--fontFamily, "Inter")`,
  background: `linear-gradient(135deg, 
    var(--theme-content1, #FAFAFA) 20%, 
    var(--theme-content2, #F4F4F5) 10%, 
    var(--theme-content3, #F1F3F4) 20%)`,
};

const headerStyle = {
  borderColor: `var(--theme-divider, #E4E4E7)`,
  background: `linear-gradient(135deg, 
    color-mix(in srgb, var(--theme-content1) 50%, transparent) 20%, 
    color-mix(in srgb, var(--theme-content2) 30%, transparent) 10%)`,
};

const sectionCardStyle = {
  background: `color-mix(in srgb, var(--theme-content2) 50%, transparent)`,
  border: `1px solid color-mix(in srgb, var(--theme-content3) 50%, transparent)`,
  borderRadius: `var(--borderRadius, 12px)`,
};

const Maintenance = () => {
  const { title = 'System Maintenance', settings = {} } = usePage().props;
  
  // Modal state for confirmation
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [confirmInput, setConfirmInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Form state
  const form = useForm({
    maintenance_mode: settings.maintenance_mode ?? false,
    maintenance_message: settings.maintenance_message ?? 'We are currently performing scheduled maintenance. We\'ll be back shortly.',
    maintenance_bypass_secret: settings.maintenance_bypass_secret ?? '',
    maintenance_bypass_ips: settings.maintenance_bypass_ips ?? [],
    maintenance_allowed_paths: settings.maintenance_allowed_paths ?? ['/api/health', '/status'],
    maintenance_ends_at: settings.maintenance_ends_at ?? '',
    maintenance_skip_verification: settings.maintenance_skip_verification ?? false,
  });
  
  const { data, setData, processing, errors } = form;
  
  // Generate bypass URL for display
  const bypassUrl = data.maintenance_bypass_secret 
    ? `${window.location.origin}?bypass=${data.maintenance_bypass_secret}`
    : 'No bypass secret configured';
  
  // Handle maintenance toggle
  const handleMaintenanceToggle = useCallback((checked) => {
    if (checked) {
      // Opening maintenance - show confirmation modal
      onOpen();
    } else {
      // Turning off maintenance - no confirmation needed
      setData('maintenance_mode', false);
    }
  }, [onOpen, setData]);
  
  // Handle confirmation modal submit
  const handleConfirmDown = useCallback(() => {
    if (confirmInput.toUpperCase() === 'DOWN') {
      setData('maintenance_mode', true);
      setConfirmInput('');
      onClose();
    } else {
      showToast.error('Please type "DOWN" to confirm.');
    }
  }, [confirmInput, setData, onClose]);
  
  // Handle copy bypass URL
  const handleCopyBypass = useCallback(async () => {
    if (!data.maintenance_bypass_secret) {
      showToast.error('No bypass secret configured.');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(bypassUrl);
      setCopied(true);
      showToast.success('Bypass URL copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error('Failed to copy to clipboard.');
    }
  }, [bypassUrl, data.maintenance_bypass_secret]);
  
  // Handle form submit
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    form.put(route('admin.developer.maintenance.update'), {
      preserveScroll: true,
      onSuccess: () => {
        showToast.success('Maintenance settings updated successfully.');
      },
      onError: (errors) => {
        showToast.error('Failed to update maintenance settings.');
      },
    });
  }, [form]);
  
  // Generate random bypass secret
  const handleGenerateSecret = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setData('maintenance_bypass_secret', secret);
  }, [setData]);
  
  // Handle bypass IPs change
  const handleBypassIpsChange = useCallback((value) => {
    const ips = value.split(',').map(ip => ip.trim()).filter(Boolean);
    setData('maintenance_bypass_ips', ips);
  }, [setData]);
  
  // Handle allowed paths change
  const handleAllowedPathsChange = useCallback((value) => {
    const paths = value.split(',').map(path => path.trim()).filter(Boolean);
    setData('maintenance_allowed_paths', paths);
  }, [setData]);
  
  return (
    <>
      <Head title={`${title} - Admin`} />
      
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
        {/* Main Card */}
        <Card className="transition-all duration-200" style={mainCardStyle}>
          <CardHeader className="border-b p-0" style={headerStyle}>
            <div className="p-6 w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl flex items-center justify-center"
                    style={{
                      background: `color-mix(in srgb, var(--theme-primary) 15%, transparent)`,
                      borderColor: `color-mix(in srgb, var(--theme-primary) 25%, transparent)`,
                      borderWidth: `var(--borderWidth, 2px)`,
                      borderRadius: `var(--borderRadius, 12px)`,
                    }}
                  >
                    <WrenchScrewdriverIcon className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-foreground">System Maintenance</h4>
                    <p className="text-sm text-default-500">
                      Control platform-wide maintenance mode and bypass settings.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    color="primary" 
                    type="submit" 
                    form="maintenance-form" 
                    isLoading={processing}
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardBody className="p-6">
            <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Status Section */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ServerStackIcon className="w-6 h-6 text-default-500" />
                      <div>
                        <h5 className="text-lg font-semibold text-foreground">Maintenance Mode Status</h5>
                        <p className="text-sm text-default-500">
                          Enable to put the platform in maintenance mode
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Chip
                        color={data.maintenance_mode ? "danger" : "success"}
                        variant="flat"
                        startContent={data.maintenance_mode ? <ExclamationTriangleIcon className="w-4 h-4" /> : <CheckCircleSolid className="w-4 h-4" />}
                      >
                        {data.maintenance_mode ? "Down" : "Online"}
                      </Chip>
                      <Switch
                        isSelected={data.maintenance_mode}
                        onValueChange={handleMaintenanceToggle}
                        color="danger"
                        size="lg"
                      />
                    </div>
                  </div>
                  
                  {data.maintenance_mode && (
                    <div className="mt-4 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                      <div className="flex gap-3">
                        <ShieldExclamationIcon className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-danger">Platform is currently in maintenance mode</p>
                          <p className="text-xs text-danger/80 mt-1">
                            Only administrators and bypass IPs can access the platform.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Maintenance Message */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <GlobeAltIcon className="w-6 h-6 text-default-500" />
                    <div>
                      <h5 className="text-lg font-semibold text-foreground">Maintenance Message</h5>
                      <p className="text-sm text-default-500">
                        Message displayed to users during maintenance
                      </p>
                    </div>
                  </div>
                  
                  <Textarea
                    value={data.maintenance_message}
                    onValueChange={(value) => setData('maintenance_message', value)}
                    placeholder="Enter maintenance message..."
                    minRows={3}
                    maxRows={6}
                    isInvalid={!!errors.maintenance_message}
                    errorMessage={errors.maintenance_message}
                    classNames={{
                      inputWrapper: "bg-default-100",
                    }}
                  />
                </div>
              </div>

              {/* Registration Verification Override */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserPlusIcon className="w-6 h-6 text-default-500" />
                      <div>
                        <h5 className="text-lg font-semibold text-foreground">Skip Registration Verification</h5>
                        <p className="text-sm text-default-500">
                          Allow tenant registration without email/phone verification during maintenance
                        </p>
                      </div>
                    </div>
                    <Switch
                      isSelected={data.maintenance_skip_verification}
                      onValueChange={(value) => setData('maintenance_skip_verification', value)}
                      color="warning"
                    />
                  </div>
                  
                  {data.maintenance_skip_verification && (
                    <div className="mt-4 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                      <div className="flex gap-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning">Verification Override Enabled</p>
                          <p className="text-xs text-warning/80 mt-1">
                            New tenants can register without email or phone verification. This is useful for testing and emergency access during maintenance.
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              <EnvelopeIcon className="w-4 h-4" />
                              <span>Email verification: Skipped</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <PhoneIcon className="w-4 h-4" />
                              <span>Phone verification: Skipped</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bypass Secret */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <KeyIcon className="w-6 h-6 text-default-500" />
                    <div>
                      <h5 className="text-lg font-semibold text-foreground">Bypass Secret</h5>
                      <p className="text-sm text-default-500">
                        Secret key to bypass maintenance mode via URL parameter
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={data.maintenance_bypass_secret}
                      onValueChange={(value) => setData('maintenance_bypass_secret', value)}
                      placeholder="Enter bypass secret or generate one..."
                      isInvalid={!!errors.maintenance_bypass_secret}
                      errorMessage={errors.maintenance_bypass_secret}
                      classNames={{
                        inputWrapper: "bg-default-100",
                      }}
                    />
                    <Button
                      onPress={handleGenerateSecret}
                      variant="flat"
                      color="primary"
                    >
                      Generate
                    </Button>
                  </div>
                  
                  {data.maintenance_bypass_secret && (
                    <div className="p-4 bg-default-100 rounded-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-default-500 mb-1">Bypass URL:</p>
                          <code className="text-xs text-primary break-all">{bypassUrl}</code>
                        </div>
                        <Tooltip content={copied ? "Copied!" : "Copy URL"}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="flat"
                            onPress={handleCopyBypass}
                          >
                            {copied ? <CheckCircleIcon className="w-4 h-4 text-success" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bypass IPs */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <GlobeAltIcon className="w-6 h-6 text-default-500" />
                    <div>
                      <h5 className="text-lg font-semibold text-foreground">Bypass IP Addresses</h5>
                      <p className="text-sm text-default-500">
                        IP addresses that can bypass maintenance mode (comma-separated)
                      </p>
                    </div>
                  </div>
                  
                  <Input
                    value={data.maintenance_bypass_ips.join(', ')}
                    onValueChange={handleBypassIpsChange}
                    placeholder="e.g., 192.168.1.1, 10.0.0.5"
                    isInvalid={!!errors.maintenance_bypass_ips}
                    errorMessage={errors.maintenance_bypass_ips}
                    classNames={{
                      inputWrapper: "bg-default-100",
                    }}
                  />
                </div>
              </div>

              {/* Allowed Paths */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <ServerStackIcon className="w-6 h-6 text-default-500" />
                    <div>
                      <h5 className="text-lg font-semibold text-foreground">Allowed Paths During Maintenance</h5>
                      <p className="text-sm text-default-500">
                        URL paths accessible during maintenance (comma-separated)
                      </p>
                    </div>
                  </div>
                  
                  <Input
                    value={data.maintenance_allowed_paths.join(', ')}
                    onValueChange={handleAllowedPathsChange}
                    placeholder="e.g., /api/health, /status"
                    isInvalid={!!errors.maintenance_allowed_paths}
                    errorMessage={errors.maintenance_allowed_paths}
                    classNames={{
                      inputWrapper: "bg-default-100",
                    }}
                  />
                </div>
              </div>

              {/* Maintenance Schedule */}
              <div className="space-y-4" style={sectionCardStyle}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-6 h-6 text-default-500" />
                    <div>
                      <h5 className="text-lg font-semibold text-foreground">Maintenance End Time</h5>
                      <p className="text-sm text-default-500">
                        Expected time when maintenance will be completed (optional)
                      </p>
                    </div>
                  </div>
                  
                  <Input
                    type="datetime-local"
                    value={data.maintenance_ends_at}
                    onValueChange={(value) => setData('maintenance_ends_at', value)}
                    isInvalid={!!errors.maintenance_ends_at}
                    errorMessage={errors.maintenance_ends_at}
                    classNames={{
                      inputWrapper: "bg-default-100",
                    }}
                  />
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              Enable Maintenance Mode
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-sm text-default-600">
                This will put the entire platform into maintenance mode. All users will be unable to access the platform except:
              </p>
              <ul className="text-sm text-default-600 list-disc list-inside space-y-1">
                <li>Administrators</li>
                <li>Users with bypass secret URL</li>
                <li>Whitelisted IP addresses</li>
              </ul>
              <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                <p className="text-sm text-warning font-medium">
                  Type <code className="font-bold">DOWN</code> to confirm
                </p>
              </div>
              <Input
                value={confirmInput}
                onValueChange={setConfirmInput}
                placeholder="Type DOWN to confirm"
                autoFocus
                classNames={{
                  inputWrapper: "bg-default-100",
                }}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={handleConfirmDown}
              isDisabled={confirmInput.toUpperCase() !== 'DOWN'}
            >
              Enable Maintenance Mode
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

Maintenance.layout = (page) => <App children={page} />;

export default Maintenance;
