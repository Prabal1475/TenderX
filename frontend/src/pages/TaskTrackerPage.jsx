import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api/client';
import { formatDate } from '../utils/formatters';

export default function TaskTrackerPage() {
  const [tasks, setTasks] = useState([]);
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New task form state
  const [title, setTitle] = useState('');
  const [tenderId, setTenderId] = useState('');
  const [category, setCategory] = useState('Technical_Bid');
  const [priority, setPriority] = useState('High');
  const [dueDate, setDueDate] = useState('');

  const loadData = async () => {
    try {
      const [taskList, tList] = await Promise.all([
        api.listTasks(),
        api.listTenders(),
      ]);
      setTasks(taskList);
      setTenders(tList);
      if (tList.length > 0 && !tenderId) {
        setTenderId(tList[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks and deadlines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleComplete = async (task) => {
    try {
      const updated = await api.updateTask(task.id, {
        is_completed: !task.is_completed,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      if (updated.is_completed) {
        toast.success(`Completed: ${task.title}`);
      } else {
        toast('Marked task pending');
      }
    } catch (err) {
      toast.error(`Update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id, taskTitle) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast('Deadline item removed');
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title || !tenderId) return;

    try {
      const payload = {
        title,
        tender_id: tenderId,
        category,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      };
      const newTask = await api.createTask(payload);
      setTasks((prev) => [newTask, ...prev]);
      setShowModal(false);
      setTitle('');
      toast.success('New milestone added to tracker');
    } catch (err) {
      toast.error(`Create task failed: ${err.message}`);
    }
  };

  const pendingTasks = tasks.filter((t) => !t.is_completed);
  const completedTasks = tasks.filter((t) => t.is_completed);

  return (
    <div className="space-y-6 animate-cascade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Bid Deadlines & Milestone Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track statutory EMD submissions, pre-bid meeting clarifications, and proposal packaging tasks
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Deadline Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Pending Items */}
        <div className="glass-panel rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pending Action Items ({pendingTasks.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="py-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full skeleton" />
                    <div className="space-y-1">
                      <div className="h-4 w-48 rounded skeleton" />
                      <div className="h-3 w-32 rounded skeleton" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : pendingTasks.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs font-medium">
              No pending tasks! All tender deadlines are cleared.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-900/40 px-2 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="text-slate-500 hover:text-teal-400 btn-tactile active:scale-[0.88] transition-colors"
                    >
                      <Circle className="w-5 h-5" />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-slate-200">{task.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-teal-300 font-medium">
                          {task.category.replace('_', ' ')}
                        </span>
                        {task.due_date && (
                          <span>Due: {formatDate(task.due_date)}</span>
                        )}
                        <span
                          className={`font-semibold ${
                            task.priority === 'High' ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          [{task.priority} Priority]
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 btn-tactile active:scale-[0.92]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Items */}
        {completedTasks.length > 0 && (
          <div className="glass-panel rounded-3xl p-5 space-y-3 opacity-75">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Completed ({completedTasks.length})</span>
            </h2>

            <div className="divide-y divide-slate-800/80">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="py-2.5 flex items-center justify-between gap-3 px-2"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className="text-emerald-400 btn-tactile active:scale-[0.88]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <p className="text-xs line-through text-slate-500">{task.title}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 btn-tactile active:scale-[0.92]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-overlay-in">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-4 animate-modal-in relative">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Add Tender Deadline / Milestone</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 btn-tactile active:scale-[0.92]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Action Item Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Upload Class-3 DSC Signed Technical Envelope on GeM"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Associated Tender</label>
                <select
                  value={tenderId}
                  onChange={(e) => setTenderId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
                >
                  {tenders.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.portal}] {t.tender_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Technical_Bid">Technical Bid</option>
                    <option value="EMD_Payment">EMD / Bank Guarantee</option>
                    <option value="Financial_Bid">Financial Bid (BoQ)</option>
                    <option value="Pre_Bid_Clarification">Pre-Bid Meeting</option>
                    <option value="Submission">Physical Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 btn-tactile active:scale-[0.97]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl btn-tactile active:scale-[0.97] shadow-lg shadow-teal-500/10"
                >
                  Save Action Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
