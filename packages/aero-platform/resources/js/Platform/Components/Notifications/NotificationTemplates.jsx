import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Textarea,
    Select,
    SelectItem,
} from "@heroui/react";
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EllipsisVerticalIcon,
    DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { showToast } from '@/utils/toastUtils';

const NotificationTemplates = ({ templates: initialTemplates = [], channels = [] }) => {
    const [templates, setTemplates] = useState(initialTemplates);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        channel: 'email',
        variables: '',
        is_active: true
    });

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

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData({
            name: '',
            subject: '',
            body: '',
            channel: 'email',
            variables: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject || '',
            body: template.body || '',
            channel: template.channel,
            variables: template.variables?.join(', ') || '',
            is_active: template.is_active
        });
        setIsModalOpen(true);
    };

    const handleDuplicate = (template) => {
        setEditingTemplate(null);
        setFormData({
            name: `${template.name} (Copy)`,
            subject: template.subject || '',
            body: template.body || '',
            channel: template.channel,
            variables: template.variables?.join(', ') || '',
            is_active: false
        });
        setIsModalOpen(true);
    };

    const handleSubmit = () => {
        const promise = new Promise(async (resolve, reject) => {
            try {
                const url = editingTemplate
                    ? route('admin.notifications.templates.update', editingTemplate.id)
                    : route('admin.notifications.templates.store');
                
                const response = await axios({
                    method: editingTemplate ? 'PUT' : 'POST',
                    url,
                    data: {
                        ...formData,
                        variables: formData.variables.split(',').map(v => v.trim()).filter(Boolean)
                    }
                });

                if (response.status === 200 || response.status === 201) {
                    router.reload({ only: ['templates'] });
                    setIsModalOpen(false);
                    resolve([response.data.message || 'Template saved successfully']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to save template']);
            }
        });

        showToast.promise(promise, {
            loading: editingTemplate ? 'Updating template...' : 'Creating template...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const handleDelete = (template) => {
        if (!confirm(`Delete template "${template.name}"?`)) return;

        const promise = new Promise(async (resolve, reject) => {
            try {
                const response = await axios.delete(
                    route('admin.notifications.templates.destroy', template.id)
                );
                if (response.status === 200) {
                    router.reload({ only: ['templates'] });
                    resolve([response.data.message || 'Template deleted']);
                }
            } catch (error) {
                reject(error.response?.data?.errors || ['Failed to delete template']);
            }
        });

        showToast.promise(promise, {
            loading: 'Deleting template...',
            success: (data) => data.join(', '),
            error: (data) => Array.isArray(data) ? data.join(', ') : data,
        });
    };

    const renderCell = (template, columnKey) => {
        switch (columnKey) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        {template.subject && (
                            <span className="text-xs text-default-400">{template.subject}</span>
                        )}
                    </div>
                );
            case 'channel':
                return (
                    <Chip
                        size="sm"
                        color={
                            template.channel === 'email' ? 'primary' :
                            template.channel === 'sms' ? 'secondary' :
                            template.channel === 'push' ? 'success' : 'warning'
                        }
                        variant="flat"
                    >
                        {template.channel.toUpperCase()}
                    </Chip>
                );
            case 'variables':
                return (
                    <div className="flex gap-1 flex-wrap">
                        {template.variables?.slice(0, 3).map((v, i) => (
                            <Chip key={i} size="sm" variant="flat">
                                {v}
                            </Chip>
                        ))}
                        {template.variables?.length > 3 && (
                            <Chip size="sm" variant="flat">
                                +{template.variables.length - 3}
                            </Chip>
                        )}
                    </div>
                );
            case 'status':
                return (
                    <Chip
                        size="sm"
                        color={template.is_active ? 'success' : 'default'}
                        variant="flat"
                    >
                        {template.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                );
            case 'actions':
                return (
                    <Dropdown>
                        <DropdownTrigger>
                            <Button isIconOnly size="sm" variant="light">
                                <EllipsisVerticalIcon className="w-5 h-5" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Template actions">
                            <DropdownItem
                                key="edit"
                                startContent={<PencilIcon className="w-4 h-4" />}
                                onPress={() => handleEdit(template)}
                            >
                                Edit
                            </DropdownItem>
                            <DropdownItem
                                key="duplicate"
                                startContent={<DocumentDuplicateIcon className="w-4 h-4" />}
                                onPress={() => handleDuplicate(template)}
                            >
                                Duplicate
                            </DropdownItem>
                            <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                onPress={() => handleDelete(template)}
                            >
                                Delete
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                );
            default:
                return template[columnKey];
        }
    };

    const columns = [
        { key: 'name', label: 'NAME' },
        { key: 'channel', label: 'CHANNEL' },
        { key: 'variables', label: 'VARIABLES' },
        { key: 'status', label: 'STATUS' },
        { key: 'actions', label: 'ACTIONS' },
    ];

    return (
        <>
            <Card className="transition-all duration-200" style={getCardStyle()}>
                <CardHeader
                    className="flex justify-between items-center"
                    style={getCardHeaderStyle()}
                >
                    <div>
                        <h3 className="text-lg font-semibold">Notification Templates</h3>
                        <p className="text-sm text-default-500">
                            Manage reusable notification templates
                        </p>
                    </div>
                    <Button
                        color="primary"
                        startContent={<PlusIcon className="w-4 h-4" />}
                        onPress={handleCreate}
                        radius={themeRadius}
                    >
                        Create Template
                    </Button>
                </CardHeader>
                <CardBody>
                    <Table
                        aria-label="Notification templates"
                        isHeaderSticky
                        classNames={{
                            wrapper: "shadow-none border border-divider rounded-lg",
                            th: "bg-default-100 text-default-600 font-semibold",
                            td: "py-3"
                        }}
                    >
                        <TableHeader columns={columns}>
                            {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                        </TableHeader>
                        <TableBody
                            items={templates}
                            emptyContent="No templates found. Create your first template."
                        >
                            {(item) => (
                                <TableRow key={item.id}>
                                    {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                size="2xl"
                scrollBehavior="inside"
                classNames={{
                    base: "bg-content1",
                    header: "border-b border-divider",
                    body: "py-6",
                    footer: "border-t border-divider"
                }}
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h2 className="text-lg font-semibold">
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </h2>
                    </ModalHeader>
                    <ModalBody>
                        <div className="flex flex-col gap-4">
                            <Input
                                label="Template Name"
                                placeholder="e.g., Welcome Email"
                                value={formData.name}
                                onValueChange={(value) => setFormData({ ...formData, name: value })}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Select
                                label="Channel"
                                placeholder="Select channel"
                                selectedKeys={[formData.channel]}
                                onSelectionChange={(keys) => 
                                    setFormData({ ...formData, channel: Array.from(keys)[0] })
                                }
                                radius={themeRadius}
                                isRequired
                            >
                                <SelectItem key="email">Email</SelectItem>
                                <SelectItem key="sms">SMS</SelectItem>
                                <SelectItem key="push">Push Notification</SelectItem>
                                <SelectItem key="slack">Slack</SelectItem>
                            </Select>

                            {(formData.channel === 'email' || formData.channel === 'push') && (
                                <Input
                                    label="Subject"
                                    placeholder="Enter subject"
                                    value={formData.subject}
                                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                                    radius={themeRadius}
                                    classNames={{ inputWrapper: "bg-default-100" }}
                                />
                            )}

                            <Textarea
                                label="Message Body"
                                placeholder="Enter message body. Use {{variable}} for dynamic content."
                                value={formData.body}
                                onValueChange={(value) => setFormData({ ...formData, body: value })}
                                minRows={6}
                                isRequired
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />

                            <Input
                                label="Variables"
                                placeholder="name, email, company (comma-separated)"
                                value={formData.variables}
                                onValueChange={(value) => setFormData({ ...formData, variables: value })}
                                description="Variables that can be used in the template body"
                                radius={themeRadius}
                                classNames={{ inputWrapper: "bg-default-100" }}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" onPress={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit}>
                            {editingTemplate ? 'Update' : 'Create'}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default NotificationTemplates;
