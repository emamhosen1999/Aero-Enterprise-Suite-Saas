import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Card, CardBody, CardHeader, Divider, Chip } from '@heroui/react';
import { CubeIcon } from '@heroicons/react/24/outline';
import App from '@/Layouts/App';
import ModuleHierarchyTree from '@/Components/ModuleHierarchyTree.jsx';

/**
 * Module Hierarchy Demo Page
 * 
 * Demonstrates the 4-level hierarchical module system
 * Modules → Submodules → Components → Actions
 */
export default function ModuleHierarchyDemo() {
    const { moduleHierarchy = [], tenant } = usePage().props;

    return (
        <App>
            <Head title="Module Hierarchy" />

            <div className="container mx-auto p-6 max-w-7xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CubeIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Module Hierarchy</h1>
                    </div>
                    <p className="text-default-500">
                        Explore the complete 4-level module structure: Modules → Submodules → Components → Actions
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Modules</p>
                                    <p className="text-2xl font-bold">{moduleHierarchy.length}</p>
                                </div>
                                <Chip color="primary" variant="flat" size="lg">
                                    Level 1
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Submodules</p>
                                    <p className="text-2xl font-bold">
                                        {moduleHierarchy.reduce((sum, m) => sum + (m.submodules?.length || 0), 0)}
                                    </p>
                                </div>
                                <Chip color="secondary" variant="flat" size="lg">
                                    Level 2
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Components</p>
                                    <p className="text-2xl font-bold">
                                        {moduleHierarchy.reduce((sum, m) => 
                                            sum + (m.submodules?.reduce((s, sub) => 
                                                s + (sub.components?.length || 0), 0) || 0), 0
                                        )}
                                    </p>
                                </div>
                                <Chip color="success" variant="flat" size="lg">
                                    Level 3
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-default-500">Actions</p>
                                    <p className="text-2xl font-bold">
                                        {moduleHierarchy.reduce((sum, m) => 
                                            sum + (m.submodules?.reduce((s, sub) => 
                                                s + (sub.components?.reduce((c, comp) => 
                                                    c + (comp.actions?.length || 0), 0) || 0), 0) || 0), 0
                                        )}
                                    </p>
                                </div>
                                <Chip color="warning" variant="flat" size="lg">
                                    Level 4
                                </Chip>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Info Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-xl font-semibold">About This System</h2>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-primary mb-1">🎯 Access Control Formula</h3>
                                <code className="bg-default-100 px-3 py-2 rounded-lg block">
                                    User Access = Plan Access (subscription) ∩ Permission Match (RBAC)
                                </code>
                            </div>
                            <Divider />
                            <div>
                                <h3 className="font-semibold mb-2">📊 Hierarchy Levels</h3>
                                <ul className="space-y-2 ml-4">
                                    <li className="flex items-center gap-2">
                                        <Chip size="sm" color="primary" variant="flat">Level 1</Chip>
                                        <span><strong>Modules</strong> - Top-level features (HRM, CRM, Project, Finance)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Chip size="sm" color="secondary" variant="flat">Level 2</Chip>
                                        <span><strong>Submodules</strong> - Feature categories (Employees, Leave, Attendance)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Chip size="sm" color="success" variant="flat">Level 3</Chip>
                                        <span><strong>Components</strong> - UI components (Employee List, Leave Calendar)</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Chip size="sm" color="warning" variant="flat">Level 4</Chip>
                                        <span><strong>Actions</strong> - Granular operations (View, Create, Update, Delete)</span>
                                    </li>
                                </ul>
                            </div>
                            <Divider />
                            <div>
                                <h3 className="font-semibold mb-2">🔐 How It Works</h3>
                                <ol className="list-decimal ml-6 space-y-1 text-sm text-default-600">
                                    <li>Platform admin creates subscription plans and selects modules</li>
                                    <li>Tenants subscribe to a plan (gets access to plan's modules)</li>
                                    <li>Tenant admin assigns permissions to roles</li>
                                    <li>Users inherit permissions from their roles</li>
                                    <li>Access granted only when both plan includes module AND user has permission</li>
                                </ol>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Hierarchy Tree */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold">Module Hierarchy Tree</h2>
                    </CardHeader>
                    <Divider />
                    <CardBody>
                        {moduleHierarchy.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-default-400">No modules configured yet.</p>
                                <p className="text-sm text-default-300 mt-2">
                                    Run: <code className="bg-default-100 px-2 py-1 rounded">php artisan db:seed --class=ModuleSeeder</code>
                                </p>
                            </div>
                        ) : (
                            <ModuleHierarchyTree
                                moduleHierarchy={moduleHierarchy}
                                showInactive={true}
                            />
                        )}
                    </CardBody>
                </Card>
            </div>
        </App>
    );
}
