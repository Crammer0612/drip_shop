import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  BarChart3, 
  ShieldAlert, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldMinus, 
  UserX, 
  UserCheck,
  Mail,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Package,
  Activity
} from 'lucide-react';
import { cn } from '../lib/utils';
import { userService, UserProfile } from '../lib/userService';
import { motion } from 'motion/react';

export function AdminDashboard() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [activeTab, setActiveTab] = useState<'users' | 'analytics' | 'logs'>('users');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`Change ${user.full_name}'s role to ${newRole}?`)) {
      await userService.updateUserRole(user.id, newRole);
      fetchUsers();
    }
  };

  const toggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'deactivated' : 'active';
    if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'reactivate' : 'deactivate'} this account?`)) {
      await userService.updateUserStatus(user.id, newStatus);
      fetchUsers();
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-4 flex items-end justify-between mb-2">
          <div>
            <h1 className="font-garamond text-4xl font-bold italic text-on-surface">Admin Dashboard</h1>
            <p className="text-on-surface-variant font-medium uppercase tracking-[0.2em] text-xs mt-1">Manage users and system performance</p>
          </div>
          <button className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95">
            <UserPlus className="w-4 h-4" />
            Add Admin
          </button>
        </div>

        <StatCard 
          icon={<Users className="w-5 h-5" />} 
          label="Total Users" 
          value={users.length.toString()} 
          trend="+12% growth"
          color="bg-primary/10 text-primary"
        />
        <StatCard 
          icon={<Package className="w-5 h-5" />} 
          label="Total Products" 
          value="142" 
          trend="+4 today"
          color="bg-secondary/10 text-secondary"
        />
        <StatCard 
          icon={<Activity className="w-5 h-5" />} 
          label="Conversion Rate" 
          value="89%" 
          trend="Engagement Peak"
          color="bg-green-500/10 text-green-600"
        />
        <StatCard 
          icon={<ShieldAlert className="w-5 h-5" />} 
          label="Security Events" 
          value="0" 
          trend="Clear"
          color="bg-error/10 text-error"
        />
      </section>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/30 gap-8">
        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users className="w-4 h-4"/>} label="Directory" />
        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<BarChart3 className="w-4 h-4"/>} label="Analytics" />
        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<Activity className="w-4 h-4"/>} label="Audit Logs" />
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/50" />
              <input 
                type="text" 
                placeholder="Search archives by name or email..." 
                className="w-full bg-surface-container p-4 pl-12 rounded-2xl border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-surface-container px-6 rounded-2xl border-none ring-1 ring-outline-variant font-bold uppercase tracking-widest text-[10px] focus:ring-2 focus:ring-primary"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as any)}
              >
                <option value="all">Every Account</option>
                <option value="admin">Administrators</option>
                <option value="user">Regular Users</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-surface border border-outline-variant/30 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">User</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Role</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Joined</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="group hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full border border-outline-variant/30" />
                        <div>
                          <p className="font-garamond text-lg font-bold text-on-surface leading-tight">{u.full_name}</p>
                          <p className="text-xs text-on-surface-variant font-mono">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        u.role === 'admin' ? "bg-primary/10 text-primary" : "bg-on-surface-variant/10 text-on-surface-variant"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-on-surface-variant font-mono text-xs">
                        <Calendar className="w-3 h-3" />
                        {new Date(u.createdAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", u.status === 'active' ? "bg-green-500" : "bg-error")} />
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleRole(u)}
                          title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                          className="p-2.5 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant hover:text-primary"
                        >
                          {u.role === 'admin' ? <ShieldMinus className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => toggleStatus(u)}
                          title={u.status === 'active' ? "Deactivate Account" : "Activate Account"}
                          className="p-2.5 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant hover:text-error"
                        >
                          {u.status === 'active' ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-3xl bg-surface-container-low/30">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <h3 className="font-garamond text-2xl font-medium text-on-surface mb-2">Performance Intelligence</h3>
            <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold">Consolidating metadata from the global grid...</p>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-3xl bg-surface-container-low/30">
          <div className="text-center">
            <Activity className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
            <h3 className="font-garamond text-2xl font-medium text-on-surface mb-2">System Audit Records</h3>
            <p className="text-on-surface-variant text-sm uppercase tracking-widest font-bold">Synchronizing forensic activity logs...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string, trend: string, color: string }) {
  return (
    <div className="bg-surface border border-outline-variant/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", color)}>
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase tracking-widest">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant mb-1">{label}</p>
        <p className="font-garamond text-3xl font-bold text-on-surface italic">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 py-4 border-b-2 transition-all relative group h-full",
        active ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
      )}
    >
      <div className={cn(
        "p-1.5 rounded-lg transition-colors",
        active ? "bg-primary/10" : "bg-surface-container group-hover:bg-surface-container-high"
      )}>
        {icon}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
