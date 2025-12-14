import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function EmployeeIndex({ auth }) {
    return (
        <AuthenticatedLayout user={auth?.user}>
            <Head title="Employees" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold mb-4">Employee Management</h1>
                <p>This page is under development.</p>
            </div>
        </AuthenticatedLayout>
    );
}
