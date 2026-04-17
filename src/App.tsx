import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, 
  Package, 
  Factory, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  Search, 
  Bell, 
  User as UserIcon,
  ChevronRight,
  Activity,
  Database,
  Truck,
  Layers,
  Scissors,
  Trash2,
  Brush,
  CheckCircle2,
  FileText,
  QrCode,
  Wallet,
  Calculator as CalculatorIcon,
  Target
} from 'lucide-react';
import { User, UserRole } from './types';
import LanguageSwitcher from './components/LanguageSwitcher';
import Toast from './components/Toast';
import NotificationDropdown from './components/NotificationDropdown';
import { authService } from './lib/authService';
import api from './lib/api';
import { uiStore } from './lib/store';
import { useI18n } from './i18n';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Sklad1 = lazy(() => import('./components/Sklad1'));
const Production = lazy(() => import('./components/Production'));
const Sklad2 = lazy(() => import('./components/Sklad2'));
const Sales = lazy(() => import('./components/Sales'));
const Clients = lazy(() => import('./components/Clients'));
const CNC = lazy(() => import('./components/CNC'));
const Finishing = lazy(() => import('./components/Finishing'));
const Sklad4 = lazy(() => import('./components/Sklad4'));
const Waste = lazy(() => import('./components/Waste'));
const Sklad3 = lazy(() => import('./components/Sklad3'));
const Reports = lazy(() => import('./components/Reports'));
const StaffManagement = lazy(() => import('./components/StaffManagement'));
const AdminActivity = lazy(() => import('./components/AdminActivity'));
const QualityControl = lazy(() => import('./components/QualityControl'));
const CourierDashboard = lazy(() => import('./components/CourierDashboard'));
const ProductionOrders = lazy(() => import('./components/ProductionOrders'));
const ProductionMaster = lazy(() => import('./components/ProductionMaster'));
const Documents = lazy(() => import('./components/Documents'));
const QRScanner = lazy(() => import('./components/QRScanner'));
const Finance = lazy(() => import('./components/Finance'));
const Contracts = lazy(() => import('./components/Contracts'));
const Debtors = lazy(() => import('./components/DebtDashboard'));
const Accounting = lazy(() => import('./components/Accounting'));
const BudgetManager = lazy(() => import('./components/BudgetManager'));
const Compliance = lazy(() => import('./components/Compliance'));
const Alerts = lazy(() => import('./components/Alerts'));
const ExecutiveDashboard = lazy(() => import('./components/ExecutiveDashboard'));
const ProductionCosting = lazy(() => import('./components/ProductionCosting'));
const ProfitabilityDashboard = lazy(() => import('./components/ProfitabilityDashboard'));

export default function App() {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeGroup, setActiveGroup] = useState<string | null>(null); // Accordion state
  const currentRole = user?.effective_role || user?.role_display || user?.role || '';
  const isPrivilegedUser = !!(user?.is_superuser || ['Bosh Admin', 'SuperAdmin', 'Admin', 'SUPERADMIN', 'ADMIN'].includes(currentRole));
  
  // Security Guard: Reset tab if not authorized
  useEffect(() => {
    if (user && activeTab !== 'dashboard') {
      const allItems = navigationGroups.flatMap(g => g.items);
      const isAllowed = allItems.some(item => item.id === activeTab && (!item.roles || isPrivilegedUser || item.roles.includes(currentRole)));
      if (!isAllowed) {
        console.warn(`Unauthorized tab access attempted: ${activeTab}. Redirecting to dashboard.`);
        setActiveTab('dashboard');
      }
    }
  }, [user, activeTab, currentRole, isPrivilegedUser]);

  useEffect(() => {
    const unsub = uiStore.subscribe(() => {
      setGlobalLoading(uiStore.isLoading);
    });

    const initAuth = async () => {
      const { access } = authService.getTokens();
      if (access) {
        try {
          const response = await api.get('users/me/');
          const userData = response.data;
          
          const parseWarehouses = (data: any) => {
            let assigned = data.assigned_warehouses || data.assignedWarehouses || [];
            if (Array.isArray(assigned)) {
              return assigned.map(Number);
            }
            if (typeof assigned === 'string' && assigned === '*') {
              return ['*'];
            }
            return [];
          };

          const assigned = parseWarehouses(userData);
          const normalizedRole = userData.effective_role || userData.role_display || userData.role;
          const finalUser = {
            ...userData,
            role: normalizedRole,
            effective_role: normalizedRole,
            name: userData.name || userData.full_name || userData.username,
            assignedWarehouses: assigned
          };

          const isPrivileged = (['Bosh Admin', 'SuperAdmin', 'Admin', 'SUPERADMIN', 'ADMIN'].includes(normalizedRole) || userData.is_superuser);
          if (isPrivileged) {
            finalUser.assignedWarehouses = ['*'];
          }
          setUser(finalUser);
        } catch (err) {
          console.error("Auth initialization failed:", err);
          authService.logout();
          setUser(null);
        } finally {
          setIsCheckingAuth(false);
        }
      } else {
        setIsCheckingAuth(false);
      }
    };
    initAuth();

    return unsub;
  }, []);

  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Mobile check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setGlobalLoading(true);
    const cleanUsername = (username.trim().startsWith('@') ? username.trim().substring(1) : username.trim()).toLowerCase();
    
    console.log("🔑 Attempting login for:", cleanUsername);
    
    try {
      const { user } = await authService.login(cleanUsername, password);
      setUser(user);
    } catch (err: any) {
      const errorData = err.response?.data;
      console.error("❌ Login Error Details:", errorData || err.message);
      setAuthError(t(errorData?.detail || errorData?.message || 'Login yoki parol noto\'g\'ri'));
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const navigationGroups = [
    {
      id: 'main',
      title: null,
      items: [
        { id: 'dashboard', name: 'Boshqaruv Paneli', icon: LayoutDashboard, roles: ['Bosh Admin', 'Omborchi', 'Ishlab chiqarish ustasi', 'CNC operatori', 'Pardozlovchi', 'Chiqindi operatori', 'Sotuv menejeri', 'Kuryer'] },
        { id: 'exec-dashboard', name: 'Direktor Paneli', icon: Target, roles: ['Bosh Admin'] },
      ]
    },
    {
      id: 'raw-materials',
      title: '1. Xom Ashyo Ombori',
      icon: Database,
      items: [
        { id: 'sklad1', name: 'Sklad №1 (Xom Ashyo)', icon: Database, roles: ['Bosh Admin', 'Omborchi'] },
      ]
    },
    {
      id: 'production-main',
      title: '2. Ishlab Chiqarish',
      icon: Factory,
      items: [
        { id: 'production', name: 'Ishlab Chiqarish', icon: Factory, roles: ['Bosh Admin', 'Ishlab chiqarish ustasi'] },
        { id: 'production-master', name: 'Usta Nazorati', icon: Activity, roles: ['Bosh Admin', 'Ishlab chiqarish ustasi'] },
        { id: 'production-orders', name: 'Buyurtmalar Natijasi', icon: BarChart3, roles: ['Bosh Admin', 'Ishlab chiqarish ustasi'] },
      ]
    },
    {
      id: 'blocks',
      title: '3. Tayyor Bloklar',
      icon: Layers,
      items: [
        { id: 'sklad2', name: 'Sklad №2 (Bloklar)', icon: Layers, roles: ['Bosh Admin', 'Ishlab chiqarish ustasi'] },
      ]
    },
    {
      id: 'decor-production',
      title: '4. Dekor Ishlab Chiqarish',
      icon: Scissors,
      items: [
        { id: 'sklad3', name: 'Sklad №3 (Ichki)', icon: Truck, roles: ['Bosh Admin', 'CNC operatori'] },
        { id: 'cnc', name: 'CNC Sexi', icon: Scissors, roles: ['Bosh Admin', 'CNC operatori'] },
        { id: 'waste', name: 'Chiqindi Sexi', icon: Trash2, roles: ['Bosh Admin', 'Chiqindi operatori'] },
        { id: 'finishing', name: 'Armirlash & Shpaklyovka', icon: Brush, roles: ['Bosh Admin', 'Pardozlovchi'] },
        { id: 'qc', name: 'Sifat Nazorati', icon: CheckCircle2, roles: ['Bosh Admin'] },
      ]
    },
    {
      id: 'final-product',
      title: '5. Tayyor Mahsulot',
      icon: CheckCircle2,
      items: [
        { id: 'sklad4', name: 'Sklad №4 (Tayyor)', icon: CheckCircle2, roles: ['Bosh Admin', 'Sotuv menejeri'] },
        { id: 'logistics', name: 'Logistika', icon: Truck, roles: ['Bosh Admin', 'Kuryer'] },
      ]
    },
    {
      id: 'sales-main',
      title: '6. Sotuv & Mijozlar',
      icon: ShoppingCart,
      items: [
        { id: 'sales', name: 'Sotuvlar', icon: ShoppingCart, roles: ['Bosh Admin', 'Sotuv menejeri'] },
        { id: 'clients', name: 'Mijozlar', icon: UserIcon, roles: ['Bosh Admin', 'Sotuv menejeri'] },
        { id: 'contracts', name: 'Shartnomalar', icon: FileText, roles: ['Bosh Admin', 'Sotuv menejeri'] },
        { id: 'debtors', name: 'Qarzdorlar', icon: Wallet, roles: ['Bosh Admin', 'Sotuv menejeri'] },
      ]
    },
    {
      id: 'analytics',
      title: '7. Hisobotlar',
      icon: BarChart3,
      items: [
        { id: 'reports', name: 'Hisobotlar', icon: BarChart3, roles: ['Bosh Admin'] },
        { id: 'profit-analytics', name: 'Tannarx & Foyda', icon: CalculatorIcon, roles: ['Bosh Admin', 'Buxgalter'] },
        { id: 'cost-analytics', name: 'Tan narx moduli', icon: CalculatorIcon, roles: ['Bosh Admin', 'Buxgalter'] },
      ]
    },
    {
      id: 'finance-main',
      title: '9. Moliya & Byudjet',
      icon: Wallet,
      items: [
        { id: 'finance', name: 'Moliya & Kassa', icon: Wallet, roles: ['Bosh Admin', 'Sotuv menejeri', 'Moliya boshqaruvchi'] },
        { id: 'accounting', name: 'Buxgalteriya', icon: CalculatorIcon, roles: ['Bosh Admin', 'Buxgalter', 'Moliya boshqaruvchi'] },
        { id: 'budgets', name: 'Byudjet Nazorati', icon: BarChart3, roles: ['Bosh Admin', 'Moliya boshqaruvchi'] },
      ]
    },
    {
      id: 'management',
      title: '8. Boshqaruv & Nazorat',
      icon: Settings,
      items: [
        { id: 'compliance', name: 'Soliq & Hujjatlar', icon: FileText, roles: ['Bosh Admin', 'Admin'] },
        { id: 'alerts', name: 'Tizim Alertlari', icon: Bell, roles: ['Bosh Admin', 'Admin'] },
        { id: 'documents', name: 'Hujjatlar Jurnali', icon: FileText, roles: ['Bosh Admin', 'Admin', 'Omborchi', 'Ishlab chiqarish ustasi', 'Sotuv menejeri', 'Kuryer'] },
        { id: 'staff', name: 'Xodimlar', icon: UserIcon, roles: ['Bosh Admin'] },
        { id: 'activity', name: 'Faollik Jurnali', icon: Activity, roles: ['Bosh Admin'] },
      ]
    }
  ];

  const pageLoader = (
    <div className="flex min-h-[280px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <span className="text-sm font-semibold text-slate-600">Sahifa yuklanmoqda...</span>
      </div>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} onAction={setActiveTab} />;
      case 'sklad1':
        return <Sklad1 user={user} />;
      case 'production':
        return <Production user={user} />;
      case 'sklad2':
        return <Sklad2 user={user} />;
      case 'sales':
        return <Sales user={user} />;
      case 'clients':
        return user ? <Clients user={user} /> : null;
      case 'cnc':
        return <CNC user={user} />;
      case 'finishing':
        return <Finishing user={user} />;
      case 'sklad4':
        return <Sklad4 user={user} />;
      case 'waste':
        return <Waste user={user} />;
      case 'sklad3':
        return <Sklad3 user={user} />;
      case 'reports':
        return <Reports user={user} />;
      case 'qc':
        return user ? <QualityControl user={user} /> : null;
      case 'logistics':
        return user ? <CourierDashboard user={user} /> : null;
      case 'production-orders':
        return <ProductionOrders />;
      case 'production-master':
        return user ? <ProductionMaster user={user} /> : null;
      case 'activity':
        return <AdminActivity />;
      case 'staff':
        return <StaffManagement user={user} />;
      case 'documents':
        return <Documents user={user} />;
      case 'finance':
        return <Finance user={user} />;
      case 'contracts':
        return <Contracts user={user} />;
      case 'debtors':
        return <Debtors user={user} />;
      case 'accounting':
        return <Accounting user={user} />;
      case 'budgets':
        return <BudgetManager />;
      case 'compliance':
        return <Compliance />;
      case 'alerts':
        return <Alerts />;
      case 'exec-dashboard':
        return <ExecutiveDashboard />;
      case 'cost-analytics':
        return <ProductionCosting />;
      case 'profit-analytics':
        return <ProfitabilityDashboard />;
      default:
        return <Dashboard user={user} onAction={setActiveTab} />;
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-2 shadow-2xl shadow-blue-200"
            >
                <Factory className="text-white w-10 h-10" />
            </motion.div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Penoplast ERP</h1>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-xl">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('Sessiya tekshirilmoqda...')}</span>
            </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100"
        >
          <div className="mb-6 flex justify-end">
            <LanguageSwitcher />
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
              <Factory className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Penoplast ERP</h1>
            <p className="text-slate-500 text-sm mt-1">{t('Tizimga kirish')}</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{t('Login')}</label>
              <input 
                type="text" 
                autoComplete="off"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                placeholder={t('Masalan: admin')}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">{t('Parol')}</label>
              <input 
                type="password" 
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-slate-50/50"
                placeholder="••••••••"
                required
              />
            </div>

            {authError && (
              <p className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-lg border border-rose-100">
                {authError}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 mt-2"
            >
              {t('Kirish')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
              {t("Hisobingiz yo'qmi? Iltimos, administratorga murojaat qiling.")}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const toggleGroup = (groupId: string) => {
    setActiveGroup(prev => prev === groupId ? null : groupId);
  };

  // Mobile Bottom Nav tabs — role-aware
  const getBottomNavItems = () => {
    const role = currentRole;
    const base = [
      { id: 'dashboard', name: 'Asosiy', icon: LayoutDashboard },
    ];

    // Role-specific tabs
    if (['Bosh Admin', 'Admin'].includes(role)) {
      base.push(
        { id: 'sklad1', name: 'Ombor', icon: Database },
        { id: 'production', name: 'Ishlab ch.', icon: Factory },
        { id: 'sales', name: 'Sotuv', icon: ShoppingCart },
      );
    } else if (['Sotuv menejeri'].includes(role)) {
      base.push(
        { id: 'sales', name: 'Sotuv', icon: ShoppingCart },
        { id: 'clients', name: 'Mijozlar', icon: UserIcon },
        { id: 'finance', name: 'Moliya', icon: Wallet },
      );
    } else if (['Omborchi'].includes(role)) {
      base.push(
        { id: 'sklad1', name: 'Xom ashyo', icon: Database },
      );
    } else if (['Ishlab chiqarish ustasi'].includes(role)) {
      base.push(
        { id: 'production', name: 'Ishlab ch.', icon: Factory },
        { id: 'production-master', name: 'Nazorat', icon: Activity },
        { id: 'sklad2', name: 'Bloklar', icon: Layers },
      );
    } else if (['CNC operatori'].includes(role)) {
      base.push(
        { id: 'cnc', name: 'CNC', icon: Scissors },
        { id: 'sklad3', name: 'Sklad', icon: Truck },
      );
    } else if (['Pardozlovchi'].includes(role)) {
      base.push(
        { id: 'finishing', name: 'Pardoz', icon: Brush },
      );
    } else if (['Chiqindi operatori'].includes(role)) {
      base.push(
        { id: 'waste', name: 'Chiqindi', icon: Trash2 },
      );
    } else if (['Kuryer'].includes(role)) {
      base.push(
        { id: 'logistics', name: 'Yetkazish', icon: Truck },
      );
    }

    // "More" always last
    base.push({ id: '__more__', name: 'Yana', icon: Menu });
    return base.slice(0, 5); // Max 5 tabs
  };



  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Global Loading Overlay */}
      <AnimatePresence>
        {globalLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-white/60 backdrop-blur-[2px] flex items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast />

      {/* =========== DESKTOP SIDEBAR (only on ≥768px) =========== */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100">
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Factory className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-tight">Penoplast</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">ERP Tizimi</p>
              </div>
            </div>

            <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto custom-scrollbar pb-8">
              {navigationGroups.map((group) => {
                const visibleItems = group.items.filter(item => {
                  const isPrivileged = isPrivilegedUser;
                  if (isPrivileged) return true;
                  const hasRole = item.roles?.includes(currentRole);
                  if ((item.id || '').startsWith('sklad')) {
                    const warehouseId = parseInt(item.id.replace('sklad', ''), 10);
                    const isAssigned = user?.assignedWarehouses?.includes('*') || user?.assignedWarehouses?.includes(warehouseId);
                    return hasRole && isAssigned;
                  }
                  return hasRole;
                });
                if (visibleItems.length === 0) return null;

                const isOpen = activeGroup === group.id;
                const isMain = group.id === 'main';

                return (
                  <div key={group.id} className="space-y-1">
                    {!isMain && group.title && (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="w-full px-4 py-2 flex items-center justify-between group/header hover:bg-slate-50 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-2">
                          {group.icon && (
                            <div className={`p-1.5 rounded-lg transition-colors ${isOpen ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400 group-hover/header:text-slate-600'}`}>
                              <group.icon className="w-4 h-4" />
                            </div>
                          )}
                          <h3 className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isOpen ? 'text-blue-600' : 'text-slate-500 group-hover/header:text-slate-900'}`}>
                            {group.title}
                          </h3>
                        </div>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-90 text-blue-400' : ''}`} />
                      </button>
                    )}
                    
                    <AnimatePresence initial={false}>
                      {(isMain || isOpen) && (
                        <motion.div 
                          initial={isMain ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden space-y-0.5"
                        >
                          {visibleItems.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id)}
                              className={`
                                w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
                                ${activeTab === item.id 
                                  ? 'bg-blue-50 text-blue-600 shadow-sm' 
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}
                                ${!isMain ? 'ml-2 w-[calc(100%-0.5rem)]' : ''}
                              `}
                            >
                              <item.icon className={`w-4.5 h-4.5 ${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                              <span className={`font-semibold text-sm ${activeTab === item.id ? 'font-bold' : ''}`}>{item.name}</span>
                              {activeTab === item.id && (
                                <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <UserIcon className="text-slate-400 w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">{t(currentRole)}</p>
                </div>
              </div>
              <div className="mb-3 flex justify-center">
                <LanguageSwitcher />
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-all font-semibold text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('Chiqish')}</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* =========== MAIN CONTENT AREA =========== */}
      <main className={`flex-1 flex flex-col min-w-0 min-h-0 ${!isMobile ? 'ml-72' : ''}`}>
        
        {/* ===== MOBILE HEADER (app-style greeting) ===== */}
        {isMobile ? (
          <header className="bg-white/80 backdrop-blur-md px-4 py-3 sticky top-0 z-40 safe-area-top border-b border-slate-100/50">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 flex-none group active:scale-90 transition-transform">
                  <Factory className="text-white w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-black text-slate-900 truncate tracking-tight">
                    {user.name.split(' ')[0]} 👋
                  </h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">
                    {t(navigationGroups.flatMap(g => g.items).find(n => n.id === activeTab)?.name || 'Boshqaruv Paneli')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <LanguageSwitcher compact />
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl active:bg-blue-50 active:text-blue-600 transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    className="w-10 h-10 flex items-center justify-center text-slate-400 rounded-xl relative active:bg-slate-100 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-2.5 right-2.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white text-[7px] flex items-center justify-center text-white font-black animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <NotificationDropdown 
                    isOpen={isNotificationsOpen} 
                    onClose={() => setIsNotificationsOpen(false)} 
                    onUnreadChange={setUnreadCount}
                  />
                </div>
              </div>
            </div>
          </header>
        ) : (
          /* ===== DESKTOP HEADER ===== */
          <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-40">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t(navigationGroups.flatMap(g => g.items).find(n => n.id === activeTab)?.name || 'Boshqaruv Paneli')}
            </h2>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <div className="flex items-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:ring-2 focus-within:ring-blue-500 transition-all group">
                <Search className="w-4 h-4 text-slate-400 mr-2 group-focus-within:text-blue-500 transition-colors" />
                <input type="text" placeholder={t('Qidirish...')} className="bg-transparent border-none outline-none text-sm w-48" />
              </div>
              <button 
                onClick={() => setIsScannerOpen(true)}
                className="p-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl relative transition-all group shadow-sm flex items-center gap-2 px-4"
              >
                <QrCode className="w-5 h-5 group-hover:rotate-12 transition-all" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('QR Skaner')}</span>
              </button>
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white text-[8px] flex items-center justify-center text-white font-black animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDropdown 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)} 
                  onUnreadChange={setUnreadCount}
                />
              </div>
            </div>
          </header>
        )}

        {/* ===== SCROLLABLE CONTENT ===== */}
        <div className={`flex-1 p-3 md:p-6 overflow-y-auto overflow-x-hidden relative min-h-0 custom-scrollbar ${isMobile ? 'pb-24' : 'pb-10'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <Suspense fallback={pageLoader}>
                {renderActiveTab()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* =========== MOBILE FAB (Floating Action Button) =========== */}
      {isMobile && (isPrivilegedUser || ['Sotuv menejeri', 'Omborchi', 'Ishlab chiqarish ustasi', 'CNC operatori', 'Pardozlovchi', 'Chiqindi operatori', 'Kuryer'].includes(currentRole)) && (
        <button
          onClick={() => {
            const primaryTab =
              isPrivilegedUser ? 'sales' :
              currentRole === 'Sotuv menejeri' ? 'sales' :
              currentRole === 'Omborchi' ? 'sklad1' :
              currentRole === 'Ishlab chiqarish ustasi' ? 'production' :
              currentRole === 'CNC operatori' ? 'cnc' :
              currentRole === 'Pardozlovchi' ? 'finishing' :
              currentRole === 'Chiqindi operatori' ? 'waste' :
              currentRole === 'Kuryer' ? 'logistics' :
              'dashboard';
            setActiveTab(primaryTab);
          }}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-300 active:scale-90 transition-transform"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}

      {/* =========== MOBILE BOTTOM NAVIGATION =========== */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 safe-area-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-around h-16 px-2">
            {getBottomNavItems().map((item) => {
              const isActive = item.id === '__more__' ? isMoreOpen : activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === '__more__') {
                      setIsMoreOpen(true);
                    } else {
                      setActiveTab(item.id);
                      setIsMoreOpen(false);
                    }
                  }}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all relative ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-colors ${isActive ? 'bg-blue-50/50' : 'bg-transparent'}`}>
                    <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                    {item.name}
                  </span>
                  {isActive && item.id !== '__more__' && (
                    <motion.div 
                      layoutId="bottomnav" 
                      className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full" 
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* =========== MOBILE "MORE" DRAWER (Bottom Sheet) =========== */}
      <AnimatePresence>
        {isMobile && isMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-y-auto safe-area-bottom"
            >
              {/* Drag handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>

              {/* User info */}
              <div className="px-5 pb-4 flex items-center gap-3 border-b border-slate-100">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{currentRole}</p>
                </div>
              </div>

              {/* All navigation items */}
              <div className="px-4 py-3">
                {navigationGroups.map((group) => {
                  const visibleItems = group.items.filter(item => {
                    const isPrivileged = isPrivilegedUser;
                    if (isPrivileged) return true;
                    return item.roles?.includes(currentRole);
                  });
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.id} className="mb-3">
                      {group.title && (
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">{group.title}</p>
                      )}
                      <div className="grid grid-cols-3 gap-2">
                        {visibleItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id);
                              setIsMoreOpen(false);
                            }}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${
                              activeTab === item.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-slate-50 text-slate-600 active:bg-slate-100'
                            }`}
                          >
                            <item.icon className="w-5 h-5" />
                            <span className="text-[10px] font-bold text-center leading-tight">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Logout */}
              <div className="px-4 pb-4">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 rounded-2xl font-bold text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Chiqish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isScannerOpen && (
          <Suspense fallback={null}>
            <QRScanner onClose={() => setIsScannerOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
