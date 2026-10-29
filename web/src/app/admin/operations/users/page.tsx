'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  User,
  Search,
  RefreshCw,
  Trash2,
  Ban,
  CheckCircle2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Phone,
  Mail,
  KeyRound,
  Shield,
  Volume2,
  VolumeX,
  AlertTriangle,
  Building,
  Crown,
  Compass,
  Lock
} from 'lucide-react';

interface UserRecord {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED';
  avatarUrl?: string;
  bio?: string;
  createdAt?: string;
}

type RoleFilterType = 'ALL' | 'ADMIN' | 'USER' | 'HOTEL' | 'TRAVELER';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Audio notification chime
  const playAlertSound = (type: 'success' | 'warning' = 'success') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      const freq = type === 'success' ? 880 : 440;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Fetch users from database API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          setUsers(data.users);
        }
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle reveal password
  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Copy text to clipboard
  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      playAlertSound('success');
    }
  };

  // Block / Unblock User
  const handleToggleBlock = async (user: UserRecord) => {
    if (user.role === 'SUPER_ADMIN') {
      alert('Cannot block Master Super Admin account.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/auth/users/toggle-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, username: user.username })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const newStatus = data.status as 'ACTIVE' | 'BLOCKED';
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        playAlertSound(newStatus === 'BLOCKED' ? 'warning' : 'success');
        setActionSuccessMessage(
          newStatus === 'BLOCKED'
            ? `User @${user.username} (${user.role}) has been BLOCKED. Account access restricted.`
            : `User @${user.username} (${user.role}) has been UNBLOCKED. Account access restored.`
        );
      } else {
        alert(data.message || 'Failed to update user status.');
      }
    } catch (err: any) {
      alert(`Error updating user status: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete User permanently
  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.role === 'SUPER_ADMIN') {
      alert('Cannot delete Master Super Admin account.');
      setDeleteConfirmUser(null);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/auth/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: deleteConfirmUser.id,
          username: deleteConfirmUser.username
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
        playAlertSound('warning');
        setActionSuccessMessage(`User @${deleteConfirmUser.username} (${deleteConfirmUser.role}) was permanently deleted from database.`);
        setDeleteConfirmUser(null);
      } else {
        alert(data.message || 'Failed to delete user.');
      }
    } catch (err: any) {
      alert(`Error deleting user: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered users across all roles and statuses
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.replace(/\s+/g, '').includes(searchQuery.replace(/\s+/g, '')) ||
      u.role?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Role filtering for: ADMIN, USER, HOTEL, TRAVELER
    if (roleFilter === 'ADMIN' && !(u.role === 'SUPER_ADMIN' || u.role === 'ADMIN')) return false;
    if (roleFilter === 'USER' && u.role !== 'USER') return false;
    if (roleFilter === 'HOTEL' && !(u.role === 'HOTEL_HOST' || u.role === 'HOTEL')) return false;
    if (roleFilter === 'TRAVELER' && u.role !== 'TRAVELER') return false;

    // Status filtering
    if (statusFilter === 'ACTIVE' && u.status === 'BLOCKED') return false;
    if (statusFilter === 'BLOCKED' && u.status !== 'BLOCKED') return false;

    return true;
  });

  const adminCount = users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length;
  const userCount = users.filter((u) => u.role === 'USER').length;
  const hotelCount = users.filter((u) => u.role === 'HOTEL_HOST' || u.role === 'HOTEL').length;
  const travelerCount = users.filter((u) => u.role === 'TRAVELER').length;
  const activeCount = users.filter((u) => u.status !== 'BLOCKED').length;
  const blockedCount = users.filter((u) => u.status === 'BLOCKED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/operations/ticketing-desk"
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-amber-400 text-xs font-bold">User</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>All User Accounts &amp; Credentials</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-normal">
              All Roles Database
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Live database directory displaying all registered platform roles: Admin, User, Hotel, and Traveler accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => {
              fetchUsers();
              setActionSuccessMessage('All database roles and user records synchronized.');
              playAlertSound('success');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 5 Role Metric Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total All Roles */}
        <div
          onClick={() => { setRoleFilter('ALL'); setStatusFilter('ALL'); }}
          className={`bg-[#0b0f19] border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all cursor-pointer group ${
            roleFilter === 'ALL' && statusFilter === 'ALL'
              ? 'border-amber-500/50 ring-1 ring-amber-500/30'
              : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
              Total Accounts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-white block">{users.length}</span>
            <span className="text-[11px] font-semibold text-amber-400 mt-1 block">
              {activeCount} Active • {blockedCount} Blocked
            </span>
          </div>
        </div>

        {/* Card 2: Admin Role */}
        <div
          onClick={() => setRoleFilter('ADMIN')}
          className={`bg-[#0b0f19] border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all cursor-pointer group ${
            roleFilter === 'ADMIN'
              ? 'border-amber-500/50 ring-1 ring-amber-500/30'
              : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-amber-300 transition-colors">
              Admin Role
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 block">{adminCount}</span>
            <span className="text-[11px] font-semibold text-amber-300 mt-1 block">
              Super &amp; Ops Admins
            </span>
          </div>
        </div>

        {/* Card 3: User Role */}
        <div
          onClick={() => setRoleFilter('USER')}
          className={`bg-[#0b0f19] border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all cursor-pointer group ${
            roleFilter === 'USER'
              ? 'border-emerald-500/50 ring-1 ring-emerald-500/30'
              : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors">
              User Role
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">{userCount}</span>
            <span className="text-[11px] font-semibold text-emerald-300 mt-1 block">
              Registered App Users
            </span>
          </div>
        </div>

        {/* Card 4: Hotel Role */}
        <div
          onClick={() => setRoleFilter('HOTEL')}
          className={`bg-[#0b0f19] border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all cursor-pointer group ${
            roleFilter === 'HOTEL'
              ? 'border-purple-500/50 ring-1 ring-purple-500/30'
              : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-purple-300 transition-colors">
              Hotel Role
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-400 block">{hotelCount}</span>
            <span className="text-[11px] font-semibold text-purple-300 mt-1 block">
              Hotel Partners &amp; Hosts
            </span>
          </div>
        </div>

        {/* Card 5: Traveler Role */}
        <div
          onClick={() => setRoleFilter('TRAVELER')}
          className={`bg-[#0b0f19] border rounded-2xl p-4 shadow-lg flex flex-col justify-between transition-all cursor-pointer group ${
            roleFilter === 'TRAVELER'
              ? 'border-blue-500/50 ring-1 ring-blue-500/30'
              : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-300 transition-colors">
              Traveler Role
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-blue-400 block">{travelerCount}</span>
            <span className="text-[11px] font-semibold text-blue-300 mt-1 block">
              Community Travelers
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-400 hover:text-white underline text-xs cursor-pointer ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Comprehensive Role Filter Toolbar */}
      <div className="space-y-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all roles by username, name, email, mobile, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Status ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('BLOCKED')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'BLOCKED'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>
        </div>

        {/* 4 Dedicated Role Pills Filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Filter by Role:</span>
          
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              roleFilter === 'ALL'
                ? 'bg-slate-100 text-slate-950'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Roles ({users.length})
          </button>

          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'ADMIN'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Admin ({adminCount})</span>
          </button>

          <button
            onClick={() => setRoleFilter('USER')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'USER'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>User ({userCount})</span>
          </button>

          <button
            onClick={() => setRoleFilter('HOTEL')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'HOTEL'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Hotel ({hotelCount})</span>
          </button>

          <button
            onClick={() => setRoleFilter('TRAVELER')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === 'TRAVELER'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Traveler ({travelerCount})</span>
          </button>
        </div>
      </div>

      {/* Database User Table */}
      <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Database User Accounts ({filteredUsers.length})</h2>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Live File &amp; Memory Synchronization</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin mx-auto mb-2" />
            <span>Loading database records across all roles...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-1">
            <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
            <p className="font-semibold text-slate-400">No accounts found matching this filter</p>
            <p className="text-[11px]">Try clearing search or selecting "All Roles".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/70 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">User Details</th>
                  <th className="px-4 py-3.5">Role</th>
                  <th className="px-4 py-3.5">Email ID</th>
                  <th className="px-4 py-3.5">Mobile Number</th>
                  <th className="px-4 py-3.5">Password</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredUsers.map((user) => {
                  const isPwVisible = !!visiblePasswords[user.id];
                  const displayPw = user.password || '••••••••';
                  const isBlocked = user.status === 'BLOCKED';
                  const isSuperAdmin = user.role === 'SUPER_ADMIN';
                  const isAdminRole = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
                  const isUserRole = user.role === 'USER';
                  const isHotelRole = user.role === 'HOTEL_HOST' || user.role === 'HOTEL';

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-850/50 transition-colors ${
                        isSuperAdmin ? 'bg-amber-500/[0.03]' : isBlocked ? 'bg-rose-950/10' : ''
                      }`}
                    >
                      {/* 1. User Avatar, Name & Username */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              user.avatarUrl ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={user.username}
                            className={`w-9 h-9 rounded-full object-cover border-2 shrink-0 ${
                              isAdminRole
                                ? 'border-amber-500 shadow-md shadow-amber-500/20'
                                : isUserRole
                                ? 'border-emerald-500 shadow-md shadow-emerald-500/20'
                                : isHotelRole
                                ? 'border-purple-500 shadow-md shadow-purple-500/20'
                                : 'border-blue-500'
                            }`}
                          />
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs truncate">
                                {user.name || user.username}
                              </span>
                              {isAdminRole && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                              {isUserRole && <User className="w-3 h-3 text-emerald-400 shrink-0" />}
                            </div>
                            <span className="text-[11px] text-amber-400 font-mono block truncate">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isAdminRole ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Crown className="w-3 h-3" />
                            <span>{user.role}</span>
                          </span>
                        ) : isUserRole ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <User className="w-3 h-3" />
                            <span>USER</span>
                          </span>
                        ) : isHotelRole ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            <Building className="w-3 h-3" />
                            <span>HOTEL</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            <Compass className="w-3 h-3" />
                            <span>TRAVELER</span>
                          </span>
                        )}
                      </td>

                      {/* 3. Email ID */}
                      <td className="px-4 py-3.5">
                        {user.email ? (
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[190px]">{user.email}</span>
                            <button
                              onClick={() => handleCopy(user.email, `email_${user.id}`)}
                              title="Copy email"
                              className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                            >
                              {copiedId === `email_${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Not provided</span>
                        )}
                      </td>

                      {/* 4. Mobile Number */}
                      <td className="px-4 py-3.5">
                        {user.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-200 font-mono">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{user.phone}</span>
                            <button
                              onClick={() => handleCopy(user.phone, `phone_${user.id}`)}
                              title="Copy phone"
                              className="text-slate-500 hover:text-slate-300 ml-1 cursor-pointer"
                            >
                              {copiedId === `phone_${user.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Not provided</span>
                        )}
                      </td>

                      {/* 5. Password with Eye Toggle & Copy */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-slate-800">
                          <KeyRound className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="font-mono text-xs text-slate-200 select-all">
                            {isPwVisible ? displayPw : '••••••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer ml-1"
                            title={isPwVisible ? 'Hide password' : 'Show password'}
                          >
                            {isPwVisible ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(displayPw, `pw_${user.id}`)}
                            className="text-slate-500 hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer ml-0.5"
                            title="Copy password to clipboard"
                          >
                            {copiedId === `pw_${user.id}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 6. Status Badge */}
                      <td className="px-4 py-3.5">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <UserX className="w-3 h-3" />
                            <span>BLOCKED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <UserCheck className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Actions: Block / Unblock & Delete */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Block / Unblock Button */}
                          <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={isProcessing || isSuperAdmin}
                            title={
                              isSuperAdmin
                                ? 'Master Super Admin cannot be blocked'
                                : isBlocked
                                ? 'Unblock user account'
                                : 'Block user account'
                            }
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              isSuperAdmin
                                ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                                : isBlocked
                                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isBlocked ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmUser(user)}
                            disabled={isProcessing || isSuperAdmin}
                            title={
                              isSuperAdmin
                                ? 'Master Super Admin cannot be deleted'
                                : 'Permanently delete user from database'
                            }
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              isSuperAdmin
                                ? 'opacity-30 cursor-not-allowed bg-slate-900 border-slate-800 text-slate-500'
                                : 'bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/30'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Safety Confirmation Modal for Permanent User Deletion */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0e131f] border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete User?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono text-amber-400 font-bold">@{deleteConfirmUser.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full Name:</span>
                <span className="text-white font-medium">{deleteConfirmUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-white font-medium">{deleteConfirmUser.role}</span>
              </div>
              {deleteConfirmUser.email && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300 font-mono truncate max-w-[200px]">{deleteConfirmUser.email}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-rose-300 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-lg">
              ⚠️ Warning: Deleting will remove this user's account, login credentials, and stored database profile.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
