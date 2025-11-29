import React from 'react';
import { Head, usePage, Link } from '@inertiajs/react';

export default function OffboardingShow() {
  const { props } = usePage();
  const { offboarding } = props;
  const tasks = offboarding?.tasks || [];
  const statusBadge = (status) => {
    const s = status === 'in-progress' ? 'in_progress' : status;
    const base = 'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium border';
    const map = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };
    return <span className={`${base} ${map[s] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{s.replace('_',' ')}</span>;
  };
  const progressBar = (p) => (
    <div className="flex items-center gap-2">
      <div className="w-32 h-2 bg-gray-200 rounded-sm overflow-hidden">
        <div className="h-full bg-indigo-500" style={{ width: `${p||0}%` }} />
      </div>
      <span className="text-xs tabular-nums">{p ?? 0}%</span>
    </div>
  );
  return (
    <div className="space-y-6">
      <Head title={props.title || 'Offboarding Details'} />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Offboarding #{offboarding.id}</h1>
        <div className="flex gap-2">
          <Link href={route('hr.offboarding.index')} prefetch className="btn">Back</Link>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white shadow-sm rounded-sm p-4">
            <h2 className="font-medium mb-3">Overview</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-600">Employee</dt><dd>{offboarding.employee?.name}</dd>
              <dt className="text-gray-600">Initiated</dt><dd>{offboarding.initiation_date}</dd>
              <dt className="text-gray-600">Last Working Date</dt><dd>{offboarding.last_working_date}</dd>
              <dt className="text-gray-600">Exit Interview</dt><dd>{offboarding.exit_interview_date ?? '—'}</dd>
              <dt className="text-gray-600">Reason</dt><dd>{offboarding.reason}</dd>
              <dt className="text-gray-600">Status</dt><dd>{statusBadge(offboarding.status)}</dd>
              <dt className="text-gray-600">Progress</dt><dd>{progressBar(offboarding.progress)}</dd>
            </dl>
            {offboarding.notes && <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{offboarding.notes}</p>}
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
                        <span>Status: {statusBadge(t.status)}</span>
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
              <li><Link href={route('hr.offboarding.index')} prefetch className="link">Back to List</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
