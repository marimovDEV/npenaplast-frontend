import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  User as UserIcon,
  Search,
  CheckCircle2,
  Lock,
  X,
  Mail,
  Key,
  Briefcase,
  History,
  Edit2
} from 'lucide-react';
import { User, UserAction, ERPRole, ERPPermission, Department } from '../types';
import api from '../lib/api';
import { uiStore } from '../lib/store';
import { useI18n } from '../i18n';

interface StaffManagementProps {
  user: User;
}

export default function StaffManagement({ user }: StaffManagementProps) {
  const { locale, t } = useI18n();
  const [staff, setStaff] = useState<User[]>([]);
  const [roles, setRoles] = useState<ERPRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [permissions, setPermissions] = useState<ERPPermission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New User Form
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    role_id: null as number | null,
    department_id: null as number | null,
    status: 'ACTIVE' as 'ACTIVE' | 'BLOCKED' | 'PENDING',
    assigned_warehouses: [] as number[]
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewLogsUser, setViewLogsUser] = useState<User | null>(null);
  const [userLogs, setUserLogs] = useState<UserAction[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [availableWarehouses, setAvailableWarehouses] = useState<any[]>([]);

  const fetchStaff = async () => {
    try {
      const [staffRes, whRes, rolesRes, deptRes] = await Promise.all([
        api.get('users/'),
        api.get('warehouses/'),
        api.get('roles/'),
        api.get('departments/')
      ]);
      setStaff(staffRes.data.results || staffRes.data);
      setAvailableWarehouses(whRes.data.results || whRes.data);
      setRoles(rolesRes.data.results || rolesRes.data);
      setDepartments(deptRes.data.results || deptRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      username: formData.username.toLowerCase(),
      full_name: formData.name,
      phone: formData.phone,
      role_id: formData.role_id,
      department_id: formData.department_id,
      status: formData.status,
      assigned_warehouses: formData.assigned_warehouses,
      ...(formData.password ? { password: formData.password } : {})
    };

    try {
      if (editingUser) {
        await api.patch(`users/${editingUser.id}/`, payload);
        uiStore.showNotification(`${formData.name} ma'lumotlari yangilandi`, 'success');
      } else {
        await api.post('users/', payload);
        uiStore.showNotification(`${formData.name} tizimga qo'shildi`, 'success');
      }
      
      fetchStaff();
      setIsAdding(false);
      setEditingUser(null);
      resetForm();
    } catch (err: any) {
      alert(t(err.response?.data?.detail || 'Xatolik yuz berdi'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      username: '', 
      phone: '', 
      password: '', 
      role_id: null,
      department_id: null,
      status: 'ACTIVE',
      assigned_warehouses: []
    });
  };

  const translateAction = (action: string) => {
    const map: Record<string, string> = {
      'CREATE': t('Yaratildi'),
      'UPDATE': t('Tahrirlandi'),
      'DELETE': t('O‘chirildi'),
      'LOGIN': t('Kirish'),
      'LOGOUT': t('Chiqish'),
      'TRANSFER': t('O‘tkazma')
    };
    return map[action] || action;
  };

  const fetchUserLogs = async (u: User) => {
    setLogsLoading(true);
    setViewLogsUser(u);
    try {
      const res = await api.get(`audit-logs/?user=${u.id}`);
      const mappedActions: UserAction[] = res.data.results ? res.data.results.map((log: any) => ({
        id: log.id,
        userId: log.user,
        userName: log.user_name || u.name,
        action: translateAction(log.action),
        module: log.module,
        description: log.description,
        timestamp: log.timestamp
      })) : [];
      setUserLogs(mappedActions);
    } catch (err) {
      console.error("Failed to fetch user logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleEditClick = (s: User) => {
    setEditingUser(s);
    setFormData({
      name: s.full_name || '',
      username: s.username,
      phone: s.phone || '',
      password: '', 
      role_id: s.role_id || null,
      department_id: s.department_id || null,
      status: s.status || 'ACTIVE',
      assigned_warehouses: Array.isArray(s.assigned_warehouses) ? s.assigned_warehouses : []
    });
    setIsAdding(true);
  };

  const toggleWarehouse = (id: number) => {
    setFormData(prev => ({
      ...prev,
      assigned_warehouses: prev.assigned_warehouses.includes(id)
        ? prev.assigned_warehouses.filter(w => w !== id)
        : [...prev.assigned_warehouses, id]
    }));
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (staffId === user.id) {
      uiStore.showNotification("O'zingizni o'chira olmaysiz", "error");
      return;
    }
    
    if (window.confirm(t(`${staffName}ni tizimdan o'chirmoqchimisiz?`))) {
      try {
        await api.delete(`users/${staffId}/`);
        uiStore.showNotification(`${staffName} o'chirildi`, 'info');
        fetchStaff();
      } catch (err) {
        alert(t("Xodimni o'chirib bo'lmadi"));
      }
    }
  };

  const filteredStaff = staff.filter(s => 
    (s.full_name?.toLowerCase() || s.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('Xodimlar Boshqaruvi')}</h1>
          <p className="text-slate-500 text-sm font-medium">{t('Tizim foydalanuvchilari va ruxsatlar')}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3.5 rounded-[20px] font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-95 text-sm uppercase tracking-widest"
        >
          <UserPlus className="w-5 h-5 text-blue-100" />
          {t('Xodim qo\'shish')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex items-center gap-4 group transition-all hover:shadow-md">
            <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder={t("Ism, login yoki telefon bo'yicha qidirish") + "..."}
              className="flex-1 bg-transparent border-none outline-none text-sm font-bold placeholder:text-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-bottom border-slate-100">
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Xodim')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Lavozim / Bo\'lim')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Status')}</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('Amallar')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStaff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/30 transition-all group cursor-pointer" onClick={() => setSelectedUser(s)}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border ${(s.effective_role || s.role_display || s.role) === 'Bosh Admin' ? 'bg-purple-50 text-purple-500 border-purple-100' : (s.effective_role || s.role_display || s.role) === 'Admin' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                            <UserIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-black text-slate-900 tracking-tight block leading-none mb-1">{s.full_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 lowercase italic">@{s.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1.5">
                          <span className={`
                            w-fit px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm border
                            ${(s.effective_role || s.role_display || s.role) === 'Bosh Admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                              (s.effective_role || s.role_display || s.role) === 'Admin' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                              'bg-slate-50 text-slate-500 border-slate-100'}
                          `}>
                            {s.effective_role || s.role_display || s.role}
                          </span>
                          {s.department_name && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{s.department_name}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            s.status === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                            s.status === 'BLOCKED' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
                            'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          }`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            s.status === 'ACTIVE' ? 'text-emerald-600' : 
                            s.status === 'BLOCKED' ? 'text-rose-600' : 
                            'text-amber-600'
                          }`}>
                            {s.status === 'ACTIVE' ? t('Faol') : 
                             s.status === 'BLOCKED' ? t('Bloklangan') : 
                             t('Kutilmoqda')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); fetchUserLogs(s); }}
                          className="p-3 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-blue-100 active:scale-95"
                          title={t('Faoliyat tarixi')}
                        >
                          <History className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(s); }}
                          className="p-3 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-amber-100 active:scale-95"
                          title={t('Tahrirlash')}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteStaff(s.id as string, s.name || s.full_name || s.username); }}
                          className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-transparent hover:border-rose-100 active:scale-95"
                          title={t("Xodimni o'chirish")}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[36px] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-all duration-700" />
            <Shield className="w-12 h-12 mb-6 text-blue-400 opacity-80" />
            <h3 className="text-2xl font-black mb-3 tracking-tight">{t('Ruxsatlar Nazorati')}</h3>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              {t('Tizimda rollarga asoslangan kirish nazorati (RBAC) o\'rnatilgan. Xodimlar faqat o\'z bo\'limlariga tegishli ma\'lumotlarni ko\'rish va boshqarish huquqiga ega.')}
            </p>
          </div>

          <div className="bg-white rounded-[36px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-50 rounded-1.5xl flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">{t('Bo\'limlar Statistikasi')}</h3>
            </div>
            <div className="space-y-4">
              {departments.map((dept, idx) => (
                <div key={dept.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full opacity-20 group-hover:opacity-100 transition-all" />
                    <span className="text-sm font-black text-slate-700 tracking-tight">{dept.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg">
                    {staff.filter(s => s.department_id === dept.id).length} {t('nafar')}
                  </span>
                </div>
              ))}
              {departments.length === 0 && (
                <p className="text-[10px] font-bold text-slate-400 italic">{t('Bo\'limlar mavjud emas')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {/* Worker Profile Detail Panel */}
        {selectedUser && (
          <div className="fixed inset-0 z-[70] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedUser(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white h-full w-full max-w-md shadow-2xl border-l border-slate-100 flex flex-col overflow-y-auto"
            >
              {/* Profile Header */}
              <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20" />
                <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                    <span className="text-3xl font-black text-white">{selectedUser.full_name?.charAt(0) || selectedUser.username?.charAt(0) || '?'}</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight leading-none mb-2">{selectedUser.full_name || selectedUser.username}</h2>
                    <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedUser.effective_role || selectedUser.role_display || selectedUser.role}</span>
                  </div>
                </div>
              </div>

              {/* Profile Details */}
              <div className="p-8 space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Login')}</p>
                    <p className="text-sm font-black text-slate-900">@{selectedUser.username}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Status')}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${selectedUser.status === 'ACTIVE' ? 'bg-emerald-500' : selectedUser.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <span className={`text-sm font-black ${selectedUser.status === 'ACTIVE' ? 'text-emerald-600' : selectedUser.status === 'BLOCKED' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {selectedUser.status === 'ACTIVE' ? t('Faol') : selectedUser.status === 'BLOCKED' ? t('Bloklangan') : t('Kutilmoqda')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Telefon')}</p>
                    <p className="text-sm font-black text-slate-900">{selectedUser.phone || '—'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('Bo\'lim')}</p>
                    <p className="text-sm font-black text-slate-900">{selectedUser.department_name || '—'}</p>
                  </div>
                </div>

                {/* Assigned Warehouses */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('Biriktirilgan Skladlar')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(selectedUser.assigned_warehouse_names) && selectedUser.assigned_warehouse_names.length > 0) ? (
                      selectedUser.assigned_warehouse_names.map((warehouseName: string) => (
                        <span key={warehouseName} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[9px] font-black uppercase tracking-widest">
                          {warehouseName}
                        </span>
                      ))
                    ) : (Array.isArray(selectedUser.assigned_warehouses) && selectedUser.assigned_warehouses.length > 0) ? (
                      selectedUser.assigned_warehouses.map((whId: any) => {
                        const wh = availableWarehouses.find((w: any) => w.id === whId);
                        return (
                          <span key={whId} className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            {wh?.name || t('Sklad') + ` #${whId}`}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">{t('Biriktirilmagan')}</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('Asosiy Vazifasi')}</h4>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-sm font-bold text-slate-800 leading-relaxed">
                      {selectedUser.responsibility_summary || t("Bu xodim uchun vazifa tavsifi hali kiritilmagan.")}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('Ish Vazifalari')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedUser.task_scope && selectedUser.task_scope.length > 0) ? (
                      selectedUser.task_scope.map((task: string) => (
                        <span key={task} className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl text-[9px] font-black uppercase tracking-widest">
                          {task}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">{t('Vazifalar ro\'yxati mavjud emas')}</span>
                    )}
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('Ruxsatlar')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedUser.all_permissions && selectedUser.all_permissions.length > 0) ? (
                      selectedUser.all_permissions.map((perm: string) => (
                        <span key={perm} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest">
                          {perm}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">{t('Maxsus ruxsatlar yo\'q')}</span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => { handleEditClick(selectedUser); setSelectedUser(null); }}
                    className="flex items-center justify-center gap-2 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 hover:bg-amber-100 transition-all active:scale-95"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('Tahrirlash')}</span>
                  </button>
                  <button 
                    onClick={() => { fetchUserLogs(selectedUser); setSelectedUser(null); }}
                    className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
                  >
                    <History className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('Tarix')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 40 }} 
              className="relative bg-white rounded-[40px] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 ${editingUser ? 'bg-amber-500' : 'bg-blue-600'} rounded-[22px] flex items-center justify-center shadow-xl ${editingUser ? 'shadow-amber-200' : 'shadow-blue-200'}`}>
                    {editingUser ? <Edit2 className="w-7 h-7 text-white" /> : <UserPlus className="w-7 h-7 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1.5">{editingUser ? t('Tahrirlash') : t('Yangi Xodim')}</h2>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{editingUser ? (editingUser.full_name || editingUser.username) : t('Ma\'lumotlarni kiriting')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAdding(false)} 
                  className="p-3 text-slate-400 hover:text-slate-900 hover:bg-white rounded-2xl transition-all shadow-sm active:scale-95 border border-transparent hover:border-slate-100"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('To\'liq ism')}</label>
                      <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                          required
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                          placeholder="Azizbek Karimov"
                      />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Login')}</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                            required
                            type="text" 
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                            placeholder="aziz88"
                          />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Telefon')}</label>
                        <input 
                            required
                            type="text" 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                            placeholder="+998 90 123 45 67"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Bo\'lim')}</label>
                        <select 
                          required
                          value={formData.department_id || ''}
                          onChange={(e) => setFormData({...formData, department_id: Number(e.target.value)})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                          <option value="">{t('Tanlang')}...</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                          ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Lavozim')}</label>
                        <select 
                          required
                          value={formData.role_id || ''}
                          onChange={(e) => setFormData({...formData, role_id: Number(e.target.value)})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                          <option value="">{t('Tanlang')}...</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Status')}</label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner appearance-none"
                        >
                          <option value="ACTIVE">{t('Faol')}</option>
                          <option value="BLOCKED">{t('Bloklangan')}</option>
                          <option value="PENDING">{t('Kutilmoqda')}</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Parol')}</label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input 
                              required={!editingUser}
                              type="password" 
                              value={formData.password}
                              onChange={(e) => setFormData({...formData, password: e.target.value})}
                              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-[22px] outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black text-slate-900 shadow-inner"
                              placeholder={editingUser ? t("O'zgartirmaslik uchun bo'sh") + "..." : "••••••••"}
                          />
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Biriktirilgan Skladlar (Ixtiyoriy)')}</label>
                    <div className="flex flex-wrap gap-2">
                      {availableWarehouses.map(w => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => toggleWarehouse(w.id)}
                          className={`
                            px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all
                            ${formData.assigned_warehouses.includes(w.id) 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-blue-200'}
                          `}
                        >
                          {w.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-[24px] font-black text-[13px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none mt-4"
                >
                  {editingUser ? t('Saqlash') : t('Tizimga qo\'shish')} &rarr;
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {viewLogsUser && (
          <div className="fixed inset-0 z-[70] flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewLogsUser(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative bg-white h-full w-full max-w-md shadow-2xl border-l border-slate-100 flex flex-col"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
                    <History className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{t('Faoliyat Tarixi')}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewLogsUser.full_name}</p>
                  </div>
                </div>
                <button onClick={() => setViewLogsUser(null)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {logsLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Yuklanmoqda')}...</p>
                  </div>
                ) : userLogs.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                    {userLogs.map((log) => (
                      <div key={log.id} className="relative pl-10 group">
                        <div className="absolute left-0 top-1.5 w-5 h-5 bg-white border-2 border-slate-200 rounded-full group-hover:border-blue-500 transition-colors z-10 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-slate-200 group-hover:bg-blue-500 rounded-full transition-colors" />
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all hover:bg-white hover:shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{log.action}</span>
                            <span className="text-[9px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString(locale)}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed mb-1">{log.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mb-6">
                      <History className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{t('Harakatlar yo\'q')}</h3>
                    <p className="text-sm text-slate-400 font-medium">{t('Bu xodim oxirgi vaqtda hech qanday amal bajarmagan.')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
