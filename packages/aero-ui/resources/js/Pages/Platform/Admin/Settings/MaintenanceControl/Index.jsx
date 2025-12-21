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

const MaintenanceControl = () => {
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
    
    form.put(route('admin.settings.maintenance.update'), {
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
          
          <CardBody className="p-6 space-y-6">
            {/* Status Indicator Card */}
            <div
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                data.maintenance_mode
                  ? 'bg-danger-50 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800'
                  : 'bg-success-50 border-success-200 dark:bg-success-900/20 dark:border-success-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-full ${
                      data.maintenance_mode
                        ? 'bg-danger-100 dark:bg-danger-900/40'
                        : 'bg-success-100 dark:bg-success-900/40'
                    }`}
                  >
                    {data.maintenance_mode ? (
                      <ExclamationTriangleIcon className="w-10 h-10 text-danger-600 dark:text-danger-400" />
                    ) : (
                      <CheckCircleIcon className="w-10 h-10 text-success-600 dark:text-success-400" />
                    )}
                  </div>
                  <div>
                    <h3
                      className={`text-2xl font-bold ${
                        data.maintenance_mode
                          ? 'text-danger-700 dark:text-danger-400'
                          : 'text-success-700 dark:text-success-400'
                      }`}
                    >
                      {data.maintenance_mode ? 'Maintenance Mode Active' : 'System is Live'}
                    </h3>
                    <p
                      className={`text-sm ${
                        data.maintenance_mode
                          ? 'text-danger-600/80 dark:text-danger-400/80'
                          : 'text-success-600/80 dark:text-success-400/80'
                      }`}
                    >
                      {data.maintenance_mode
                        ? 'All users will see the maintenance page. Only bypassed IPs/secrets can access.'
                        : 'Platform is fully operational and accessible to all users.'}
                    </p>
                  </div>
                </div>
                
                <Chip
                  size="lg"
                  variant="flat"
                  color={data.maintenance_mode ? 'danger' : 'success'}
                  startContent={
                    data.maintenance_mode ? (
                      <ShieldExclamationIcon className="w-4 h-4" />
                    ) : (
                      <GlobeAltIcon className="w-4 h-4" />
                    )
                  }
                >
                  {data.maintenance_mode ? 'OFFLINE' : 'ONLINE'}
                </Chip>
              </div>
            </div>
            
            <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Kill Switch Section */}
              <div className="p-6 rounded-xl" style={sectionCardStyle}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        background: 'color-mix(in srgb, var(--theme-danger) 15%, transparent)',
                      }}
                    >
                      <ServerStackIcon className="w-6 h-6 text-danger" />
                    </div>
                    <div>
                      <h5 className="text-lg font-semibold text-foreground">Maintenance Kill Switch</h5>
                      <p className="text-sm text-default-500">
                        Enable to immediately put the platform into maintenance mode.
                      </p>
                    </div>
                  </div>
                  
                  <Switch
                    size="lg"
                    color="danger"
                    isSelected={data.maintenance_mode}
                    onValueChange={handleMaintenanceToggle}
                    classNames={{
                      wrapper: 'group-data-[selected=true]:bg-danger',
                    }}
                  />
                </div>
              </div>
              
              {/* Message Configuration */}
              <div className="p-6 rounded-xl space-y-4" style={sectionCardStyle}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{
                      background: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)',
                    }}
                  >
                    <ClipboardDocumentIcon className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                  </div>
                  <div>
                    <h5 className="text-base font-semibold text-foreground">Public Message</h5>
                    <p className="text-xs text-default-500">
                      This message will be displayed to users during maintenance.
                    </p>
                  </div>
                </div>
                
                <Textarea
                  label="Maintenance Message"
                  labelPlacement="outside"
                  placeholder="Enter the message users will see during maintenance..."
                  value={data.maintenance_message}
                  onValueChange={(value) => setData('maintenance_message', value)}
                  minRows={3}
                  maxRows={6}
                  description="Supports plain text. Keep it concise and informative."
                  isInvalid={!!errors.maintenance_message}
                  errorMessage={errors.maintenance_message}
                  classNames={{
                    inputWrapper: 'bg-default-100',
                  }}
                />
                
                <Input
                  type="datetime-local"
                  label="Estimated End Time (Optional)"
                  labelPlacement="outside"
                  placeholder="When do you expect maintenance to end?"
                  value={data.maintenance_ends_at ? data.maintenance_ends_at.slice(0, 16) : ''}
                  onChange={(e) => setData('maintenance_ends_at', e.target.value)}
                  startContent={<ClockIcon className="w-4 h-4 text-default-400" />}
                  description="Users will see a countdown if this is set."
                  classNames={{
                    inputWrapper: 'bg-default-100',
                  }}
                />
              </div>
              
              {/* Bypass Configuration */}
              <div className="p-6 rounded-xl space-y-4" style={sectionCardStyle}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="p-2.5 rounded-lg"
                    style={{
                      background: 'color-mix(in srgb, var(--theme-warning) 15%, transparent)',
                    }}
                  >
                    <KeyIcon className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <h5 className="text-base font-semibold text-foreground">Bypass Configuration</h5>
                    <p className="text-xs text-default-500">
                      Configure how admins can bypass maintenance mode for testing.
                    </p>
                  </div>
                </div>
                
                {/* Secret Key */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bypass Secret</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={data.maintenance_bypass_secret}
                      placeholder="No bypass secret configured"
                      startContent={<KeyIcon className="w-4 h-4 text-default-400" />}
                      classNames={{
                        inputWrapper: 'bg-default-100',
                        input: 'font-mono text-sm',
                      }}
                    />
                    <Tooltip content="Generate new secret">
                      <Button
                        isIconOnly
                        variant="flat"
                        color="primary"
                        onPress={handleGenerateSecret}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                
                {/* Bypass URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bypass URL</label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={bypassUrl}
                      classNames={{
                        inputWrapper: 'bg-default-100',
                        input: 'font-mono text-sm text-default-500',
                      }}
                    />
                    <Tooltip content={copied ? 'Copied!' : 'Copy URL'}>
                      <Button
                        isIconOnly
                        variant="flat"
                        color={copied ? 'success' : 'default'}
                        onPress={handleCopyBypass}
                      >
                        {copied ? (
                          <CheckCircleSolid className="w-5 h-5" />
                        ) : (
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        )}
                      </Button>
                    </Tooltip>
                  </div>
                  <p className="text-xs text-default-400">
                    Add this URL parameter to bypass maintenance mode: <code className="bg-default-100 px-1 rounded">?bypass=YOUR_SECRET</code>
                  </p>
                </div>
                
                <Divider className="my-4" />
                
                {/* Bypass IPs */}
                <Input
                  label="Bypass IP Addresses"
                  labelPlacement="outside"
                  placeholder="127.0.0.1, 192.168.1.100"
                  value={(data.maintenance_bypass_ips || []).join(', ')}
                  onChange={(e) => handleBypassIpsChange(e.target.value)}
                  description="Comma-separated list of IP addresses that can bypass maintenance mode."
                  classNames={{
                    inputWrapper: 'bg-default-100',
                  }}
                />
                
                {/* Allowed Paths */}
                <Input
                  label="Allowed Paths"
                  labelPlacement="outside"
                  placeholder="/api/health, /status, /webhook/*"
                  value={(data.maintenance_allowed_paths || []).join(', ')}
                  onChange={(e) => handleAllowedPathsChange(e.target.value)}
                  description="Comma-separated list of paths accessible during maintenance. Supports wildcards (*)."
                  classNames={{
                    inputWrapper: 'bg-default-100',
                  }}
                />
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
      
      {/* Confirmation Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          setConfirmInput('');
          onClose();
        }}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-danger-100 dark:bg-danger-900/40">
                <ExclamationTriangleIcon className="w-6 h-6 text-danger" />
              </div>
              <span>Confirm Maintenance Mode</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                You are about to put the entire platform into maintenance mode. This will:
              </p>
              <ul className="list-disc list-inside text-sm text-default-500 space-y-1">
                <li>Show a maintenance page to all users</li>
                <li>Block access to all routes except bypassed ones</li>
                <li>Log out active sessions (users will need to re-authenticate)</li>
              </ul>
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-lg border border-danger-200 dark:border-danger-800">
                <p className="text-sm text-danger-700 dark:text-danger-400 font-medium mb-2">
                  Type <span className="font-bold font-mono bg-danger-100 dark:bg-danger-900/40 px-2 py-0.5 rounded">DOWN</span> to confirm:
                </p>
                <Input
                  placeholder="Type DOWN to confirm"
                  value={confirmInput}
                  onValueChange={setConfirmInput}
                  autoFocus
                  classNames={{
                    inputWrapper: 'bg-white dark:bg-default-100',
                    input: 'font-mono text-center uppercase',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmDown();
                    }
                  }}
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="light" 
              onPress={() => {
                setConfirmInput('');
                onClose();
              }}
            >
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

MaintenanceControl.layout = (page) => <App>{page}</App>;

export default MaintenanceControl;
