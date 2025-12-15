import { useState } from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Switch,
    Tabs,
    Tab,
    Select,
    SelectItem,
    Textarea,
    Chip,
} from "@heroui/react";
import {
    EnvelopeIcon,
    ChatBubbleLeftIcon,
    BellIcon,
    CheckCircleIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';

const ChannelConfiguration = ({ channels: initialChannels = {} }) => {
    const [channels, setChannels] = useState(initialChannels);
    const [testing, setTesting] = useState({});

    const getThemeRadius = () => {
        const rootStyles = getComputedStyle(document.documentElement);
        const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
        const radiusValue = parseInt(borderRadius);
        if (radiusValue === 0) return 'none';
        if (radiusValue <= 4) return 'sm';
        if (radiusValue <= 8) return 'md';
        if (radiusValue <= 12) return 'lg';
        return 'full';
    };

    const themeRadius = getThemeRadius();

    const getCardStyle = () => ({
        border: `var(--borderWidth, 2px) solid transparent`,
        borderRadius: `var(--borderRadius, 12px)`,
        fontFamily: `var(--fontFamily, "Inter")`,
        transform: `scale(var(--scale, 1))`,
        background: `linear-gradient(135deg, 
            var(--theme-content1, #FAFAFA) 20%, 
            var(--theme-content2, #F4F4F5) 10%, 
            var(--theme-content3, #F1F3F4) 20%)`,
    });

    const getCardHeaderStyle = () => ({
        borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    });

    const handleSave = (channelType) => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('admin.notifications.channels.update', channelType),
                    channels[channelType]
                );
                if (response.status === 200) {
                    resolve([response.data.message || `${channelType} channel updated`]);
                }
            } catch (error) {
                reject(error.response?.data?.errors || [`Failed to update ${channelType} channel`]);
            }
        });

        showToast.promise(promise, {
            loading: `Updating ${channelType} channel...`,
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleTest = (channelType) => {
        setTesting({ ...testing, [channelType]: true });

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(
                    route('admin.notifications.channels.test', channelType),
                    channels[channelType]
                );
                if (response.status === 200) {
                    setTesting({ ...testing, [channelType]: false });
                    resolve([response.data.message || 'Test notification sent']);
                }
            } catch (error) {
                setTesting({ ...testing, [channelType]: false });
                reject(error.response?.data?.errors || ['Test failed']);
            }
        });

        showToast.promise(promise, {
            loading: 'Sending test notification...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const updateChannel = (channelType, field, value) => {
        setChannels({
            ...channels,
            [channelType]: {
                ...channels[channelType],
                [field]: value
            }
        });
    };

    const EmailConfig = () => (
        <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Enable Email Notifications</p>
                    <p className="text-xs text-default-400">
                        Send notifications via email
                    </p>
                </div>
                <Switch
                    isSelected={channels.email?.enabled || false}
                    onValueChange={(value) => updateChannel('email', 'enabled', value)}
                />
            </div>

            {channels.email?.enabled && (
                <>
                    <Select
                        label="Mail Driver"
                        placeholder="Select driver"
                        selectedKeys={[channels.email?.driver || 'smtp']}
                        onSelectionChange={(keys) => 
                            updateChannel('email', 'driver', Array.from(keys)[0])
                        }
                        radius={themeRadius}
                    >
                        <SelectItem key="smtp">SMTP</SelectItem>
                        <SelectItem key="sendmail">Sendmail</SelectItem>
                        <SelectItem key="mailgun">Mailgun</SelectItem>
                        <SelectItem key="ses">Amazon SES</SelectItem>
                        <SelectItem key="postmark">Postmark</SelectItem>
                    </Select>

                    <Input
                        label="From Address"
                        placeholder="noreply@yourdomain.com"
                        value={channels.email?.from_address || ''}
                        onValueChange={(value) => updateChannel('email', 'from_address', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <Input
                        label="From Name"
                        placeholder="Your Company"
                        value={channels.email?.from_name || ''}
                        onValueChange={(value) => updateChannel('email', 'from_name', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    {channels.email?.driver === 'smtp' && (
                        <>
                            <Input
                                label="SMTP Host"
                                placeholder="smtp.gmail.com"
                                value={channels.email?.host || ''}
                                onValueChange={(value) => updateChannel('email', 'host', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="SMTP Port"
                                placeholder="587"
                                value={channels.email?.port || ''}
                                onValueChange={(value) => updateChannel('email', 'port', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Username"
                                value={channels.email?.username || ''}
                                onValueChange={(value) => updateChannel('email', 'username', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Password"
                                type="password"
                                value={channels.email?.password || ''}
                                onValueChange={(value) => updateChannel('email', 'password', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Select
                                label="Encryption"
                                selectedKeys={[channels.email?.encryption || 'tls']}
                                onSelectionChange={(keys) => 
                                    updateChannel('email', 'encryption', Array.from(keys)[0])
                                }
                                radius={themeRadius}
                            >
                                <SelectItem key="tls">TLS</SelectItem>
                                <SelectItem key="ssl">SSL</SelectItem>
                                <SelectItem key="">None</SelectItem>
                            </Select>
                        </>
                    )}

                    {(channels.email?.driver === 'mailgun' || channels.email?.driver === 'postmark' || channels.email?.driver === 'ses') && (
                        <Input
                            label="API Key"
                            type="password"
                            placeholder="Enter API key"
                            value={channels.email?.api_key || ''}
                            onValueChange={(value) => updateChannel('email', 'api_key', value)}
                            radius={themeRadius}
                            classNames={{ inputWrapper: "bg-default-100" }}
                        />
                    )}

                    <div className="flex gap-2">
                        <Button
                            color="primary"
                            onPress={() => handleSave('email')}
                            radius={themeRadius}
                        >
                            Save Configuration
                        </Button>
                        <Button
                            variant="flat"
                            onPress={() => handleTest('email')}
                            isLoading={testing.email}
                            radius={themeRadius}
                        >
                            Send Test Email
                        </Button>
                    </div>
                </>
            )}
        </div>
    );

    const SmsConfig = () => (
        <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Enable SMS Notifications</p>
                    <p className="text-xs text-default-400">
                        Send notifications via SMS
                    </p>
                </div>
                <Switch
                    isSelected={channels.sms?.enabled || false}
                    onValueChange={(value) => updateChannel('sms', 'enabled', value)}
                />
            </div>

            {channels.sms?.enabled && (
                <>
                    <Select
                        label="SMS Provider"
                        placeholder="Select provider"
                        selectedKeys={[channels.sms?.provider || 'twilio']}
                        onSelectionChange={(keys) => 
                            updateChannel('sms', 'provider', Array.from(keys)[0])
                        }
                        radius={themeRadius}
                    >
                        <SelectItem key="twilio">Twilio</SelectItem>
                        <SelectItem key="nexmo">Vonage (Nexmo)</SelectItem>
                        <SelectItem key="aws_sns">AWS SNS</SelectItem>
                    </Select>

                    <Input
                        label="Account SID / API Key"
                        placeholder="Enter account SID or API key"
                        value={channels.sms?.account_sid || ''}
                        onValueChange={(value) => updateChannel('sms', 'account_sid', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <Input
                        label="Auth Token / Secret"
                        type="password"
                        placeholder="Enter auth token or secret"
                        value={channels.sms?.auth_token || ''}
                        onValueChange={(value) => updateChannel('sms', 'auth_token', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <Input
                        label="From Number"
                        placeholder="+1234567890"
                        value={channels.sms?.from_number || ''}
                        onValueChange={(value) => updateChannel('sms', 'from_number', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <div className="flex gap-2">
                        <Button
                            color="primary"
                            onPress={() => handleSave('sms')}
                            radius={themeRadius}
                        >
                            Save Configuration
                        </Button>
                        <Button
                            variant="flat"
                            onPress={() => handleTest('sms')}
                            isLoading={testing.sms}
                            radius={themeRadius}
                        >
                            Send Test SMS
                        </Button>
                    </div>
                </>
            )}
        </div>
    );

    const PushConfig = () => (
        <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Enable Push Notifications</p>
                    <p className="text-xs text-default-400">
                        Send push notifications to mobile/web apps
                    </p>
                </div>
                <Switch
                    isSelected={channels.push?.enabled || false}
                    onValueChange={(value) => updateChannel('push', 'enabled', value)}
                />
            </div>

            {channels.push?.enabled && (
                <>
                    <Select
                        label="Push Provider"
                        placeholder="Select provider"
                        selectedKeys={[channels.push?.provider || 'fcm']}
                        onSelectionChange={(keys) => 
                            updateChannel('push', 'provider', Array.from(keys)[0])
                        }
                        radius={themeRadius}
                    >
                        <SelectItem key="fcm">Firebase Cloud Messaging (FCM)</SelectItem>
                        <SelectItem key="apns">Apple Push Notification (APNS)</SelectItem>
                        <SelectItem key="onesignal">OneSignal</SelectItem>
                    </Select>

                    {channels.push?.provider === 'fcm' && (
                        <>
                            <Input
                                label="Server Key"
                                type="password"
                                placeholder="Enter FCM server key"
                                value={channels.push?.server_key || ''}
                                onValueChange={(value) => updateChannel('push', 'server_key', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Sender ID"
                                placeholder="Enter FCM sender ID"
                                value={channels.push?.sender_id || ''}
                                onValueChange={(value) => updateChannel('push', 'sender_id', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </>
                    )}

                    {channels.push?.provider === 'apns' && (
                        <>
                            <Textarea
                                label="Certificate"
                                placeholder="Paste APNS certificate"
                                value={channels.push?.certificate || ''}
                                onValueChange={(value) => updateChannel('push', 'certificate', value)}
                                minRows={4}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Bundle ID"
                                placeholder="com.yourapp.bundle"
                                value={channels.push?.bundle_id || ''}
                                onValueChange={(value) => updateChannel('push', 'bundle_id', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </>
                    )}

                    {channels.push?.provider === 'onesignal' && (
                        <>
                            <Input
                                label="App ID"
                                placeholder="Enter OneSignal app ID"
                                value={channels.push?.app_id || ''}
                                onValueChange={(value) => updateChannel('push', 'app_id', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="REST API Key"
                                type="password"
                                placeholder="Enter REST API key"
                                value={channels.push?.api_key || ''}
                                onValueChange={(value) => updateChannel('push', 'api_key', value)}
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </>
                    )}

                    <div className="flex gap-2">
                        <Button
                            color="primary"
                            onPress={() => handleSave('push')}
                            radius={themeRadius}
                        >
                            Save Configuration
                        </Button>
                        <Button
                            variant="flat"
                            onPress={() => handleTest('push')}
                            isLoading={testing.push}
                            radius={themeRadius}
                        >
                            Send Test Push
                        </Button>
                    </div>
                </>
            )}
        </div>
    );

    const SlackConfig = () => (
        <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium">Enable Slack Notifications</p>
                    <p className="text-xs text-default-400">
                        Send notifications to Slack channels
                    </p>
                </div>
                <Switch
                    isSelected={channels.slack?.enabled || false}
                    onValueChange={(value) => updateChannel('slack', 'enabled', value)}
                />
            </div>

            {channels.slack?.enabled && (
                <>
                    <Input
                        label="Webhook URL"
                        placeholder="https://hooks.slack.com/services/..."
                        value={channels.slack?.webhook_url || ''}
                        onValueChange={(value) => updateChannel('slack', 'webhook_url', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <Input
                        label="Default Channel"
                        placeholder="#notifications"
                        value={channels.slack?.default_channel || ''}
                        onValueChange={(value) => updateChannel('slack', 'default_channel', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <Input
                        label="Bot Username"
                        placeholder="Notification Bot"
                        value={channels.slack?.username || ''}
                        onValueChange={(value) => updateChannel('slack', 'username', value)}
                        radius={themeRadius}
                        classNames={{ inputWrapper: "bg-default-100" }}
                    />

                    <div className="flex gap-2">
                        <Button
                            color="primary"
                            onPress={() => handleSave('slack')}
                            radius={themeRadius}
                        >
                            Save Configuration
                        </Button>
                        <Button
                            variant="flat"
                            onPress={() => handleTest('slack')}
                            isLoading={testing.slack}
                            radius={themeRadius}
                        >
                            Send Test Message
                        </Button>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <Card className="transition-all duration-200" style={getCardStyle()}>
            <CardHeader style={getCardHeaderStyle()}>
                <div>
                    <h3 className="text-lg font-semibold">Channel Configuration</h3>
                    <p className="text-sm text-default-500">
                        Configure notification channels and providers
                    </p>
                </div>
            </CardHeader>
            <CardBody>
                <Tabs aria-label="Notification channels" radius={themeRadius}>
                    <Tab
                        key="email"
                        title={
                            <div className="flex items-center gap-2">
                                <EnvelopeIcon className="w-4 h-4" />
                                <span>Email</span>
                                {channels.email?.enabled && (
                                    <Chip size="sm" color="success" variant="flat">Active</Chip>
                                )}
                            </div>
                        }
                    >
                        <EmailConfig />
                    </Tab>
                    <Tab
                        key="sms"
                        title={
                            <div className="flex items-center gap-2">
                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                <span>SMS</span>
                                {channels.sms?.enabled && (
                                    <Chip size="sm" color="success" variant="flat">Active</Chip>
                                )}
                            </div>
                        }
                    >
                        <SmsConfig />
                    </Tab>
                    <Tab
                        key="push"
                        title={
                            <div className="flex items-center gap-2">
                                <BellIcon className="w-4 h-4" />
                                <span>Push</span>
                                {channels.push?.enabled && (
                                    <Chip size="sm" color="success" variant="flat">Active</Chip>
                                )}
                            </div>
                        }
                    >
                        <PushConfig />
                    </Tab>
                    <Tab
                        key="slack"
                        title={
                            <div className="flex items-center gap-2">
                                <ChatBubbleLeftIcon className="w-4 h-4" />
                                <span>Slack</span>
                                {channels.slack?.enabled && (
                                    <Chip size="sm" color="success" variant="flat">Active</Chip>
                                )}
                            </div>
                        }
                    >
                        <SlackConfig />
                    </Tab>
                </Tabs>
            </CardBody>
        </Card>
    );
};

export default ChannelConfiguration;
