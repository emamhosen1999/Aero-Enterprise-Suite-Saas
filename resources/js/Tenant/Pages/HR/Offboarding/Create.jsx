import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';

export default function OffboardingCreate() {
  const { data, setData, post, processing, errors } = useForm({
    employee_id: '',
    initiation_date: '',
    last_working_date: '',
    exit_interview_date: '',
    reason: 'resignation',
    notes: '',
    tasks: []
  });
  const [newTask, setNewTask] = useState({ task: '', description: '', due_date: '', assigned_to: '' });

  const addTask = () => {
    if (!newTask.task) return;
    setData('tasks', [...data.tasks, newTask]);
    setNewTask({ task: '', description: '', due_date: '', assigned_to: '' });
  };

  const removeTask = (idx) => setData('tasks', data.tasks.filter((_,i)=>i!==idx));

  const submit = (e) => { e.preventDefault(); post(route('hr.offboarding.store')); };

  return (
    <div className="space-y-6">
      <Head title="Create Offboarding" />
      <h1 className="text-xl font-semibold">New Offboarding</h1>
      <form onSubmit={submit} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label className="form-label">Employee ID</label>
              <input className="input" value={data.employee_id} onChange={e=>setData('employee_id', e.target.value)} />
              {errors.employee_id && <p className="error-text">{errors.employee_id}</p>}
            </div>
            <div>
              <label className="form-label">Initiation Date</label>
              <input type="date" className="input" value={data.initiation_date} onChange={e=>setData('initiation_date', e.target.value)} />
              {errors.initiation_date && <p className="error-text">{errors.initiation_date}</p>}
            </div>
            <div>
              <label className="form-label">Last Working Date</label>
              <input type="date" className="input" value={data.last_working_date} onChange={e=>setData('last_working_date', e.target.value)} />
              {errors.last_working_date && <p className="error-text">{errors.last_working_date}</p>}
            </div>
            <div>
              <label className="form-label">Exit Interview Date</label>
              <input type="date" className="input" value={data.exit_interview_date} onChange={e=>setData('exit_interview_date', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Reason</label>
              <select className="input" value={data.reason} onChange={e=>setData('reason', e.target.value)}>
                {['resignation','termination','retirement','end-of-contract','other'].map(r=> <option key={r} value={r}>{r}</option>)}
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
              <div className="grid md:grid-cols-5 gap-2 items-end">
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
                <button type="button" onClick={addTask} className="btn btn-secondary w-full">Add</button>
              </div>
              <div>
                {data.tasks.length === 0 && <p className="text-xs text-gray-500">No tasks added.</p>}
                <ul className="divide-y mt-2">
                  {data.tasks.map((t,i)=>(
                    <li key={i} className="py-2 flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{t.task}</p>
                        <p className="text-xs text-gray-500">Due: {t.due_date || '—'} Assignee: {t.assigned_to || '—'}</p>
                      </div>
                      <button type="button" className="link text-red-600" onClick={()=>removeTask(i)}>Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary" disabled={processing}>Create</button>
          <Link href={route('hr.offboarding.index')} prefetch className="btn">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
