import React, { useState, useEffect } from "react";
import { database } from "../lib/firebase";
import { Task, Listing, Client } from "../types";
import { Plus, Check, Calendar, AlertCircle, Clock, Bell, Trash2, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TaskTrackerProps {
  listings: Listing[];
  clients: Client[];
  onTasksChanged?: () => void;
}

export default function TaskTracker({ listings, clients, onTasksChanged }: TaskTrackerProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState<Task["category"]>("Follow-up");
  const [listingId, setListingId] = useState("");
  const [clientId, setClientId] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Listing" | "Compliance" | "Marketing" | "Follow-up">("All");

  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const data = await database.getTasks();
    // Sort tasks: uncompleted first, then by due date
    const sorted = [...data].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    setTasks(sorted);
    generateAutomatedReminders(sorted);
    setLoading(false);
  };

  const generateAutomatedReminders = (currentTasks: Task[]) => {
    const reminders: string[] = [];
    const today = new Date();
    
    // Check for urgent task dates
    currentTasks.forEach(task => {
      if (!task.completed) {
        const due = new Date(task.dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 3) {
          reminders.push(`⚠️ URGENT TASK: "${task.title}" is due in ${diffDays} day(s) on ${new Date(task.dueDate).toLocaleDateString()}.`);
        } else if (diffDays < 0) {
          reminders.push(`🚨 OVERDUE TASK: "${task.title}" was due on ${new Date(task.dueDate).toLocaleDateString()}!`);
        }
      }
    });

    // Check for Listing Key Dates (inspection, closing deadlines)
    listings.forEach(listing => {
      if (listing.status !== "Closed" && listing.keyDates) {
        const { inspectionDeadline, closingDate } = listing.keyDates;
        
        if (inspectionDeadline) {
          const deadline = new Date(inspectionDeadline);
          const diff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff <= 5) {
            reminders.push(`📅 KEY DATE ALERT: Inspection Deadline for "${listing.address}" is on ${deadline.toLocaleDateString()} (${diff} days left).`);
          }
        }
        
        if (closingDate) {
          const closing = new Date(closingDate);
          const diff = Math.ceil((closing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diff >= 0 && diff <= 7) {
            reminders.push(`🏡 CLOSING ALERT: Closing transaction scheduled for "${listing.address}" is on ${closing.toLocaleDateString()} (${diff} days left!).`);
          }
        }
      }
    });

    setNotifications(reminders);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    const newTask: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      title,
      description,
      dueDate: new Date(dueDate).toISOString(),
      completed: false,
      category,
      listingId: listingId || undefined,
      targetClientId: clientId || undefined,
      agentId: "agent_sarah",
      automated: false
    };

    await database.saveTask(newTask);
    setTitle("");
    setDescription("");
    setDueDate("");
    setListingId("");
    setClientId("");
    
    // Reload
    await loadTasks();
    if (onTasksChanged) onTasksChanged();
  };

  const handleToggleComplete = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    await database.saveTask(updated);
    await loadTasks();
    if (onTasksChanged) onTasksChanged();
  };

  const handleDeleteTask = async (id: string) => {
    await database.deleteTask(id);
    await loadTasks();
    if (onTasksChanged) onTasksChanged();
  };

  const filteredTasks = tasks.filter(task => {
    if (activeTab === "All") return true;
    return task.category === activeTab;
  });

  return (
    <div id="task_tracker_root" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Task Creation & Reminders */}
      <div className="space-y-6 lg:col-span-1">
        {/* Automated Reminders Bar */}
        <div id="automated_reminders_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
            <h3 className="font-semibold text-gray-900 tracking-tight">Key Date Reminders</h3>
          </div>
          
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-sm italic">All listing milestones and tasks are currently on track.</p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {notifications.map((notif, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-100/60 text-xs text-amber-800 leading-relaxed font-medium">
                  {notif}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Form */}
        <div id="create_task_card" className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 tracking-tight mb-4">Add Listing Task & Follow-up</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Draft Purchase Addendum"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Details & Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. Ensure we clear inspection checklist items."
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Task["category"])}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40"
                >
                  <option value="Listing">Listing Admin</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Follow-up">Client Follow-up</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Link to Listing Property</label>
              <select
                value={listingId}
                onChange={e => setListingId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
              >
                <option value="">-- No Property Attached --</option>
                {listings.map(l => (
                  <option key={l.id} value={l.id}>{l.address} ({l.status})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Link to Client</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/40 text-gray-700"
              >
                <option value="">-- No Client Attached --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Reminder Task
            </button>
          </form>
        </div>
      </div>

      {/* Task List Grid */}
      <div className="lg:col-span-2 space-y-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {(["All", "Listing", "Compliance", "Marketing", "Follow-up"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "bg-gray-950 text-white border-gray-950 shadow-sm"
                    : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"
                }`}
              >
                {tab === "All" ? "All Reminders" : tab}
              </button>
            ))}
          </div>
          <span className="text-xs font-mono text-gray-400 font-medium">
            {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {/* Task Cards */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading agent reminders...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-medium text-sm">No tasks found</p>
            <p className="text-gray-500 text-xs mt-1">Select another filter or create a custom follow-up reminder.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map(task => {
                const linkedListing = listings.find(l => l.id === task.listingId);
                const linkedClient = clients.find(c => c.id === task.targetClientId);
                const isOverdue = !task.completed && new Date(task.dueDate) < new Date();

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={task.id}
                    id={`task_item_${task.id}`}
                    className={`p-4 rounded-xl border transition-all bg-white flex items-start gap-4 ${
                      task.completed
                        ? "border-gray-100 opacity-60"
                        : isOverdue
                        ? "border-red-100 bg-red-50/5 hover:border-red-200"
                        : "border-gray-100 hover:border-gray-200 shadow-sm"
                    }`}
                  >
                    {/* Completion Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 mt-0.5 ${
                        task.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : isOverdue
                          ? "border-red-300 hover:border-red-400 bg-red-50 text-red-500"
                          : "border-gray-300 hover:border-gray-400 text-gray-400"
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    {/* Task details */}
                    <div className="flex-grow space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className={`text-sm font-semibold tracking-tight ${
                            task.completed ? "line-through text-gray-400" : "text-gray-900"
                          }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-gray-500 text-xs mt-1 leading-relaxed">{task.description}</p>
                          )}
                        </div>
                        {/* Category Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wide font-semibold uppercase ${
                          task.category === "Listing"
                            ? "bg-blue-50 text-blue-700"
                            : task.category === "Compliance"
                            ? "bg-purple-50 text-purple-700"
                            : task.category === "Marketing"
                            ? "bg-pink-50 text-pink-700"
                            : "bg-teal-50 text-teal-700"
                        }`}>
                          {task.category}
                        </span>
                      </div>

                      {/* Associated References */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-gray-500">
                        {/* Due Date */}
                        <span className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                          {isOverdue && " (Overdue)"}
                        </span>

                        {/* Linked Property */}
                        {linkedListing && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                            🏡 {linkedListing.address}
                          </span>
                        )}

                        {/* Linked Client */}
                        {linkedClient && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                            👤 {linkedClient.name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
