import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function OnboardingEdit({}) {
  const { props } = usePage();
  const { onboarding } = props;
  const { data, setData, put, processing, errors } = useForm({
    start_date: onboarding.start_date || '',
    expected_completion_date: onboarding.expected_completion_date || '',
    actual_completion_date: onboarding.actual_completion_date || '',
    status: onboarding.status || 'pending',
    notes: onboarding.notes || '',
    tasks: onboarding.tasks?.map(t => ({
      id: t.id,
      task: t.task,
      description: t.description,
      due_date: t.due_date,
      completed_date: t.completed_date,
      status: t.status,
      assigned_to: t.assigned_to,
      notes: t.notes,
    })) || []
  });
  const [newTask, setNewTask] = useState({ task: '', description: '', due_date: '', assigned_to: '' });

  const addTask = () => {
    if (!newTask.task) return;
    setData('tasks', [...data.tasks, { ...newTask, status: 'pending' }]);
    setNewTask({ task: '', description: '', due_date: '', assigned_to: '' });
  };

  const removeTask = (idx) => {
    const copy = [...data.tasks];
    copy.splice(idx,1);
    setData('tasks', copy);
  };

  const updateTaskField = (idx, field, value) => {
    const copy = [...data.tasks];
    copy[idx] = { ...copy[idx], [field]: value };
    setData('tasks', copy);
  };

  const submit = (e) => {
    e.preventDefault();
    put(route('hr.onboarding.update', onboarding.id));
  };

  return (
    <div className="space-y-6">
      <Head title={`Edit Onboarding #${onboarding.id}`} />
      <h1 className="text-xl font-semibold">Edit Onboarding #{onboarding.id}</h1>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="input" value={data.start_date} onChange={e=>setData('start_date', e.target.value)} />
              {errors.start_date && <p className="error-text">{errors.start_date}</p>}
            </div>
            <div>
              <label className="form-label">Expected Completion</label>
              <input type="date" className="input" value={data.expected_completion_date} onChange={e=>setData('expected_completion_date', e.target.value)} />
              {errors.expected_completion_date && <p className="error-text">{errors.expected_completion_date}</p>}
            </div>
            <div>
              <label className="form-label">Actual Completion</label>
              <input type="date" className="input" value={data.actual_completion_date} onChange={e=>setData('actual_completion_date', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="input" value={data.status} onChange={e=>setData('status', e.target.value)}>
                {['pending','in_progress','completed','cancelled'].map(s=> <option key={s} value={s}>{s.replace('_','-')}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea className="textarea" value={data.notes} onChange={e=>setData('notes', e.target.value)} />
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white shadow-sm rounded-sm p-4 space-y-4">
              <h2 className="font-medium">Tasks</h2>
              <div className="grid md:grid-cols-6 gap-2 items-end text-xs">
                <div className="md:col-span-2">
                  <label className="form-label">Task</label>
                  <input className="input" value={newTask.task} onChange={e=>setNewTask({...newTask, task: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Due</label>
                  <input type="date" className="input" value={newTask.due_date} onChange={e=>setNewTask({...newTask, due_date: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Assignee ID</label>
                  <input className="input" value={newTask.assigned_to} onChange={e=>setNewTask({...newTask, assigned_to: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select className="input" value={newTask.status || 'pending'} onChange={e=>setNewTask({...newTask, status: e.target.value})}>
                    {['pending','in_progress','completed','not-applicable'].map(s=> <option key={s} value={s}>{s.replace('_','-')}</option>)}
                  </select>
                </div>
                <button type="button" onClick={addTask} className="btn btn-secondary w-full">Add</button>
              </div>
              <div>
                {data.tasks.length === 0 && <p className="text-xs text-gray-500">No tasks.</p>}
                <ul className="divide-y mt-2">
                  {data.tasks.map((t,i)=>(
                    <li key={i} className="py-2 space-y-2">
                      <div className="flex items-start justify-between">
                        <input className="input flex-1 mr-2" value={t.task} onChange={e=>updateTaskField(i,'task', e.target.value)} />
                        <button type="button" className="link text-red-600" onClick={()=>removeTask(i)}>Remove</button>
                      </div>
                      <div className="grid md:grid-cols-6 gap-2 text-xs">
                        <input className="input md:col-span-2" placeholder="Description" value={t.description||''} onChange={e=>updateTaskField(i,'description', e.target.value)} />
                        <input type="date" className="input" value={t.due_date||''} onChange={e=>updateTaskField(i,'due_date', e.target.value)} />
                        <input className="input" placeholder="Assignee" value={t.assigned_to||''} onChange={e=>updateTaskField(i,'assigned_to', e.target.value)} />
                        <select className="input" value={t.status} onChange={e=>updateTaskField(i,'status', e.target.value)}>
                          {['pending','in_progress','completed','not-applicable'].map(s=> <option key={s} value={s}>{s.replace('_','-')}</option>)}
                        </select>
                        <input type="date" className="input" value={t.completed_date||''} onChange={e=>updateTaskField(i,'completed_date', e.target.value)} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={processing}>Save</button>
          <Link href={route('hr.onboarding.show', onboarding.id)} className="btn">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
