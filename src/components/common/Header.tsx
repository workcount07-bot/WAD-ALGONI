import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  UserCheck,
  ChevronDown,
  Menu,
  AlertTriangle,
  X,
  Package,
  FileText,
  DollarSign,
  LogOut
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { UserRole, Language } from '../../types/erp';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    companySettings,
    language,
    setLanguage,
    theme,
    setTheme,
    currentUser,
    setCurrentUser,
    users,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    setGlobalSearchOpen,
    setActiveTab,
    logout,
    t
  } = useERP();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roleLabels: Record<UserRole, string> = {
    admin: t('admin'),
    manager: t('manager'),
    stockkeeper: t('stockkeeper'),
    cashier: t('cashier'),
    accountant: t('accountant'),
  };

  const handleRoleSelect = (usr: typeof currentUser) => {
    setCurrentUser(usr);
    setUserDropdownOpen(false);
  };

  const handleLangSelect = (lang: Language) => {
    setLanguage(lang);
    setLangDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile menu toggle + Company branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Toggle Navigation Menu"
          id="btn-toggle-sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {companySettings.logo ? (
            <img
              src={companySettings.logo}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              ERP
            </div>
          )}
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
              {companySettings.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Stock, Ventes & Facturation
            </p>
          </div>
        </div>
      </div>

      {/* Center: Global Search Bar Trigger */}
      <div className="flex-1 max-w-md mx-4">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors shadow-2xs"
          id="btn-global-search"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">{t('searchPlaceholder')}</span>
            <span className="sm:hidden">Rechercher...</span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, Language, Theme, Notifications, User Profile */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setLangDropdownOpen(!langDropdownOpen);
              setUserDropdownOpen(false);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            id="btn-language-menu"
          >
            <Globe className="w-4 h-4 text-indigo-500" />
            <span className="uppercase font-semibold">{language}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {langDropdownOpen && (
            <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => handleLangSelect('fr')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${
                  language === 'fr' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🇫🇷 Français</span>
                {language === 'fr' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
              </button>
              <button
                onClick={() => handleLangSelect('en')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${
                  language === 'en' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🇬🇧 English</span>
                {language === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
              </button>
              <button
                onClick={() => handleLangSelect('ar')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium ${
                  language === 'ar' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>🇸🇦 العربية (RTL)</span>
                {language === 'ar' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
              </button>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          title={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
          id="btn-theme-toggle"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* Notifications Center */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserDropdownOpen(false);
              setLangDropdownOpen(false);
            }}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title="Notifications"
            id="btn-notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Notifications ({notifications.length})
                  </span>
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    Effacer tout
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Aucune notification pour le moment.
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        if (n.linkTab) setActiveTab(n.linkTab);
                        setNotificationsOpen(false);
                      }}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer flex gap-3 ${
                        !n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.severity === 'danger' ? (
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        ) : n.severity === 'warning' ? (
                          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                            <Package className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.date}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotificationsOpen(false);
              setLangDropdownOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors border border-slate-200 dark:border-slate-700"
            id="btn-user-profile"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-indigo-500/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                {roleLabels[currentUser.role]}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {currentUser.role === 'admin' ? (
                <>
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Changer de rôle (Administrateur)
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Basculer vers un autre collaborateur :
                    </p>
                  </div>

                  <div className="py-1">
                    {users.map(u => (
                      <button
                        key={u.id}
                        onClick={() => handleRoleSelect(u)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-xs transition-colors ${
                          currentUser.id === u.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-md object-cover"
                        />
                        <div className="text-left rtl:text-right flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                          <p className="text-[10px] opacity-75">{roleLabels[u.role]}</p>
                        </div>
                        {currentUser.id === u.id && <UserCheck className="w-4 h-4 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">{roleLabels[currentUser.role]}</p>
                    <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                  </div>
                </div>
              )}

              <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
