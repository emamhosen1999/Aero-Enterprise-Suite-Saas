import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';

export default function OnboardingShow() {
  const { props } = usePage();
  const { onboarding } = props;
  const tasks = onboarding?.tasks || [];

  return (
    <div className="space-y-6">
      <Head title={props.title || 'Onboarding Details'} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Onboarding #{onboarding.id}</h1>
        <div className="flex gap-2">
          <Link href={route('hr.onboarding.edit', onboarding.id)}  className="btn btn-secondary">Edit</Link>
          <Link href={route('hr.onboarding.index')}  className="btn">Back</Link>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white shadow-sm rounded-sm p-4">
            <h2 className="font-medium mb-3">Overview</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-600">Employee</dt><dd>{onboarding.employee?.name}</dd>
              <dt className="text-gray-600">Start</dt><dd>{onboarding.start_date}</dd>
              <dt className="text-gray-600">Expected Completion</dt><dd>{onboarding.expected_completion_date}</dd>
              <dt className="text-gray-600">Actual Completion</dt><dd>{onboarding.actual_completion_date ?? '—'}</dd>
              <dt className="text-gray-600">Status</dt><dd><span className="badge badge-outline">{onboarding.status}</span></dd>
              <dt className="text-gray-600">Progress</dt><dd>{onboarding.progress ?? '0'}%</dd>
            </dl>
            {onboarding.notes && <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{onboarding.notes}</p>}
          </div>
          <div className="bg-white shadow-sm rounded-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-medium">Tasks ({tasks.length})</h3>
            </div>
            <ul className="divide-y">
              {tasks.map(t => (
                <li key={t.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.task}</p>
                      {t.description && <p className="text-gray-500 text-xs mt-1">{t.description}</p>}
                      <div className="mt-1 text-xs text-gray-500 flex gap-4">
                        <span>Due: {t.due_date || '—'}</span>
                        <span>Status: <span className="badge badge-ghost">{t.status}</span></span>
                        <span>Assignee: {t.assignee?.name || '—'}</span>
                      </div>
                    </div>
                    {t.completed_date && <span className="text-xs text-green-600">Completed {t.completed_date}</span>}
                  </div>
                </li>
              ))}
              {tasks.length === 0 && <li className="px-4 py-3 text-sm text-gray-500">No tasks added.</li>}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white shadow-sm rounded-sm p-4">
            <h2 className="font-medium mb-3">Actions</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href={route('hr.onboarding.edit', onboarding.id)}  className="link">Edit Onboarding</Link></li>
              <li><Link href={route('hr.onboarding.index')}  className="link">Back to List</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
