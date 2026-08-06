import React from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Truck,
  Users,
  AlertOctagon,
  ShoppingBag,
  ShoppingCart,
  FileSpreadsheet,
  CreditCard,
  Warehouse,
  BarChart3,
  UserCog,
  Settings,
  X,
  Sparkles
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    debtors,
    invoices,
    products,
    currentUser,
    t
  } = useERP();

  const isUserAdmin = currentUser?.role === 'admin';
  const assignedIds = currentUser?.assignedProductIds || [];
  const userProducts = isUserAdmin ? products : products.filter(p => assignedIds.includes(p.id));

  const unpaidInvoicesCount = invoices.filter(i => i.remainingAmount > 0).length;
  const stockAlertCount = userProducts.filter(p => p.currentStock <= p.minStock).length;
  const debtorsCount = debtors.length;

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'sales',
      label: t('sales'),
      icon: ShoppingCart,
      badge: 'POS',
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'debtors',
      label: t('debtors'),
      icon: AlertOctagon,
      badge: debtorsCount > 0 ? `${debtorsCount}` : null,
      badgeColor: 'bg-rose-600 text-white animate-pulse',
      highlight: true,
    },
    {
      id: 'products',
      label: t('products'),
      icon: Package,
      badge: stockAlertCount > 0 ? `${stockAlertCount}` : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'categories',
      label: t('categories'),
      icon: FolderTree,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'purchases',
      label: t('purchases'),
      icon: ShoppingBag,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'invoices',
      label: t('invoices'),
      icon: FileSpreadsheet,
      badge: unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount}` : null,
      badgeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'payments',
      label: t('payments'),
      icon: CreditCard,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'inventory',
      label: t('inventory'),
      icon: Warehouse,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'customers',
      label: t('customers'),
      icon: Users,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'suppliers',
      label: t('suppliers'),
      icon: Truck,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'users',
      label: t('users'),
      icon: UserCog,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      badge: null,
      badgeColor: '',
    },
  ];

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 rtl:right-0 rtl:left-auto z-40 w-64 bg-slate-900 text-slate-300 flex flex-col border-r rtl:border-l border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 rtl:translate-x-full rtl:lg:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">WAD-ALGONI</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Section Label */}
        <div className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Module ERP Principal
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {(currentUser?.role === 'admin' ? navItems : navItems.filter(item => item.id === 'sales')).map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                  item.highlight && !isActive
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/60'
                    : isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
                id={`nav-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-white'
                        : item.highlight
                        ? 'text-rose-400'
                        : 'text-slate-400 group-hover:text-indigo-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Footer System Info */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-800/60 border border-slate-800 text-slate-400 text-[11px]">
          <div className="flex items-center justify-between font-medium text-slate-300">
            <span>Version ERP</span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono bg-indigo-900/60 text-indigo-300 rounded">
              v3.4.2 PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Gros & Détail, Stock & Créances
          </p>
        </div>
      </aside>
    </>
  );
};
