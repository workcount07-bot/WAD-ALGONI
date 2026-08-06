import React, { useState } from 'react';
import {
  UserCog,
  Shield,
  UserCheck,
  Mail,
  Lock,
  Plus,
  Edit,
  Trash2,
  X,
  UserPlus,
  Upload,
  Eye,
  EyeOff,
  Key,
  Store,
  Package,
  CheckSquare,
  Square,
  Search,
  FileText,
  BarChart2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Layers,
  Check
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { User, UserRole, Product } from '../../types/erp';

export const UsersView: React.FC = () => {
  const {
    users,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    stores,
    addStore,
    products,
    invoices,
    categories
  } = useERP();

  const isUserAdmin = currentUser?.role === 'admin';
  const visibleUsers = isUserAdmin ? users : users.filter(u => u.id === currentUser?.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'products' | 'activity'>('profile');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const [newStoreInput, setNewStoreInput] = useState('');
  const [isAddingNewStore, setIsAddingNewStore] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    email: '',
    role: 'cashier' as UserRole,
    storeName: stores[0] || 'Boutique Principale',
    avatar: ''
  });

  // Assigned products selection
  const [assignedProductIds, setAssignedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // User activity modal view
  const [activityModalUser, setActivityModalUser] = useState<User | null>(null);

  const roleLabels: Record<UserRole, { label: string; badge: string; desc: string }> = {
    admin: {
      label: 'Administrateur',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
      desc: "Accès illimité à l'ensemble des modules ERP, configuration, sauvegardes & comptabilité."
    },
    manager: {
      label: 'Gestionnaire',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
      desc: 'Gestion des stocks, approvisionnements, validation des devis et rapports analytiques.'
    },
    stockkeeper: {
      label: 'Magasinier',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
      desc: 'Entrées/sorties de stock, inventaire physique, gestion des rayons et dépôts.'
    },
    cashier: {
      label: 'Caissier',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
      desc: 'Point de Vente (POS), encaissement rapide, édition de tickets de caisse.'
    },
    accountant: {
      label: 'Comptable',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
      desc: 'Facturation, suivi des règlements, créances clients et balance fournisseurs.'
    }
  };

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
  ];

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, avatar: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsAddingNewStore(false);
    setNewStoreInput('');
    setModalTab('profile');
    setAssignedProductIds([]);
    setProductSearch('');
    setFormData({
      name: '',
      username: '',
      password: '',
      email: '',
      role: 'cashier',
      storeName: stores[0] || 'Boutique Principale',
      avatar: defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)]
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u: User, initialTab: 'profile' | 'products' | 'activity' = 'profile') => {
    setEditingUser(u);
    setIsAddingNewStore(false);
    setNewStoreInput('');
    setModalTab(initialTab);
    setAssignedProductIds(u.assignedProductIds || []);
    setProductSearch('');
    setFormData({
      name: u.name,
      username: u.username || u.name.toLowerCase().replace(/\s+/g, ''),
      password: u.password || '123456',
      email: u.email,
      role: u.role,
      storeName: u.storeName || stores[0] || 'Boutique Principale',
      avatar: u.avatar || defaultAvatars[0]
    });
    setModalOpen(true);
  };

  const toggleProductAssignment = (productId: string) => {
    setAssignedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    setAssignedProductIds(products.map(p => p.id));
  };

  const handleDeselectAllProducts = () => {
    setAssignedProductIds([]);
  };

  const handleSelectStoreProducts = () => {
    const storeProds = products.filter(
      p => !p.storeName || p.storeName === 'Toutes les boutiques' || p.storeName === formData.storeName
    );
    setAssignedProductIds(storeProds.map(p => p.id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Veuillez remplir le nom et l'email de l'utilisateur.");
      return;
    }

    const targetStore = isAddingNewStore && newStoreInput.trim() ? newStoreInput.trim() : formData.storeName;
    if (targetStore) {
      addStore(targetStore);
    }

    const cleanUsername = formData.username.trim() || formData.name.toLowerCase().replace(/\s+/g, '');
    const cleanPassword = formData.password.trim() || '123456';

    if (editingUser) {
      updateUser(editingUser.id, {
        name: formData.name,
        username: cleanUsername,
        password: cleanPassword,
        email: formData.email,
        role: formData.role,
        storeName: targetStore,
        assignedProductIds: assignedProductIds,
        avatar: formData.avatar
      });
    } else {
      addUser({
        name: formData.name,
        username: cleanUsername,
        password: cleanPassword,
        email: formData.email,
        role: formData.role,
        storeName: targetStore,
        assignedProductIds: assignedProductIds,
        avatar: formData.avatar
      });
    }

    setModalOpen(false);
  };

  // Filter products inside modal
  const modalFilteredProducts = products.filter(p => {
    const term = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.barcode.includes(term) ||
      p.brand.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center font-bold">
            <UserCog className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestion des Utilisateurs & Attribution des Produits
            </h2>
            <p className="text-xs text-slate-500">
              Affectez des produits spécifiques aux caissiers, attribuez des boutiques et consultez leurs ventes en temps réel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span>Session: <strong>{currentUser.name}</strong></span>
          </div>

          {isUserAdmin && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau Utilisateur</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleUsers.map(u => {
          const isSelected = currentUser.id === u.id;
          const roleInfo = roleLabels[u.role] || roleLabels.cashier;

          // User invoices and sales metrics
          const userInvoices = invoices.filter(
            inv => inv.createdBy === u.name || inv.userId === u.id
          );
          const totalCA = userInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
          const assignedCount = u.assignedProductIds ? u.assignedProductIds.length : 0;

          return (
            <div
              key={u.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border transition-all space-y-4 ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{u.name}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                          Session active
                        </span>
                      )}
                    </h3>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${roleInfo.badge}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(u, 'profile')}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                    title="Modifier l'utilisateur"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {!isSelected && (
                    <button
                      onClick={() => setUserToDelete(u)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Supprimer l'utilisateur"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {!isSelected && (
                    <button
                      onClick={() => setCurrentUser(u)}
                      className="ml-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white dark:bg-slate-700 dark:hover:bg-indigo-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Basculer vers cette session"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Basculer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Email & Account info */}
              <div className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/50 font-semibold text-purple-700 dark:text-purple-300">
                    <Store className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{u.storeName || 'Boutique Principale'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 font-mono">
                  <span className="text-slate-600 dark:text-slate-300">
                    User: <strong className="text-indigo-600 dark:text-indigo-400">{u.username || u.name.toLowerCase().replace(/\s+/g, '')}</strong>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">
                      Pass: <strong className="text-slate-700 dark:text-slate-200">
                        {visiblePasswords[u.id] ? (u.password || '123456') : '••••••'}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(u.id)}
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={visiblePasswords[u.id] ? "Masquer" : "Afficher"}
                    >
                      {visiblePasswords[u.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Assigned Products & Sales Summary Bar */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <div className="p-2 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>Produits Permis</span>
                  </p>
                  <p className="text-xs font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">
                    {u.role === 'admin' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Accès Total ({products.length})</span>
                    ) : assignedCount > 0 ? (
                      <span>{assignedCount} produit(s) dédié(s)</span>
                    ) : (
                      <span className="text-slate-500">Tous les produits</span>
                    )}
                  </p>
                </div>

                <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" />
                    <span>Ventes / CA Réalisé</span>
                  </p>
                  <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">
                    {totalCA.toLocaleString()} CFA ({userInvoices.length} fact.)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(u, 'products')}
                  className="flex-1 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-800/60"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Attribuer Produits ({assignedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivityModalUser(u)}
                  className="flex-1 py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200/60 dark:border-indigo-800/60"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ventes & Factures</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit User Modal with Tabs */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingUser ? `Utilisateur : ${editingUser.name}` : 'Créer un nouvel utilisateur'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'profile'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span>1. Profil & Accès</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('products')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  modalTab === 'products'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>2. Produits Assignés ({assignedProductIds.length})</span>
              </button>

              {editingUser && (
                <button
                  type="button"
                  onClick={() => setModalTab('activity')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    modalTab === 'activity'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>3. Ventes & Factures</span>
                </button>
              )}
            </div>

            {/* Modal Body with scrollable content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* TAB 1: PROFILE FORM */}
              {modalTab === 'profile' && (
                <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nom complet <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ousmane Sow"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  {/* Username & Password */}
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <Key className="w-4 h-4 text-indigo-500" />
                      <span>Identifiants de Connexion (Username & Mot de passe)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Nom d'utilisateur (Username) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: ousmane"
                          value={formData.username}
                          onChange={e => setFormData({ ...formData, username: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Mot de passe <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showModalPassword ? 'text' : 'password'}
                            required
                            placeholder="Ex: pass123"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            className="w-full pl-3.5 pr-9 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowModalPassword(!showModalPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Adresse Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: ousmane.sow@entreprise.sn"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rôle & Habilitation <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="cashier">Caissier (POS, Ventes comptant)</option>
                      <option value="stockkeeper">Magasinier (Stock, Inventaire)</option>
                      <option value="accountant">Comptable (Facturation, Règlements)</option>
                      <option value="manager">Gestionnaire (Achats, Devis, Rapports)</option>
                      <option value="admin">Administrateur (Accès total ERP)</option>
                    </select>
                  </div>

                  {/* Boutique / Store Selection */}
                  <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                        <Store className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>Boutique / Point de Vente Assigné</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewStore(!isAddingNewStore)}
                        className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold cursor-pointer"
                      >
                        {isAddingNewStore ? "Choisir boutique existante" : "+ Créer une nouvelle boutique"}
                      </button>
                    </div>

                    {isAddingNewStore ? (
                      <input
                        type="text"
                        placeholder="Nom de la nouvelle boutique (ex: Boutique Pikine)"
                        value={newStoreInput}
                        onChange={e => setNewStoreInput(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <select
                        value={formData.storeName}
                        onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-purple-500 text-slate-900 dark:text-white font-semibold"
                      >
                        {stores.map((st, idx) => (
                          <option key={idx} value={st}>
                            🏪 {st}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Local Photo Selection */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Photo de profil (Avatar)
                    </label>

                    <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="relative group shrink-0">
                        <img
                          src={formData.avatar || defaultAvatars[0]}
                          alt="Preview"
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/30 shadow-xs"
                        />
                      </div>

                      <div className="flex-1 space-y-2">
                        <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choisir une photo locale</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: ASSIGNED PRODUCTS SELECTION */}
              {modalTab === 'products' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-900 dark:text-blue-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span>Sélection des Produits Autorisés pour {formData.name || 'cet utilisateur'}</span>
                    </p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400">
                      L'utilisateur verra <strong>UNIQUEMENT</strong> les produits cochés ci-dessous lors de ses encaissements, catalogues et inventaires. Vous pouvez cocher ou décocher des produits individuellement ou cliquer sur les boutons rapides ci-dessous.
                    </p>
                  </div>

                  {/* Actions & Search */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filtrer les produits par nom..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Tout cocher
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllProducts}
                        className="px-2.5 py-1.5 text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-rose-600 dark:text-rose-400 hover:bg-slate-200 rounded-lg cursor-pointer"
                      >
                        Tout décocher
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectStoreProducts}
                        className="px-2.5 py-1.5 text-[11px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-lg cursor-pointer"
                      >
                        Boutique
                      </button>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
                    <span>Produits en catalogue: {products.length}</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      {assignedProductIds.length} produit(s) coché(s)
                    </span>
                  </div>

                  {/* Products Check List */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/60 max-h-80 overflow-y-auto bg-white dark:bg-slate-900">
                    {modalFilteredProducts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Aucun produit ne correspond à la recherche.
                      </div>
                    ) : (
                      modalFilteredProducts.map(p => {
                        const isChecked = assignedProductIds.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProductAssignment(p.id)}
                            className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-50'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="shrink-0">
                                {isChecked ? (
                                  <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {p.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Ref: {p.code} | BC: {p.barcode} | Stock: <span className="font-bold text-slate-700 dark:text-slate-200">{p.currentStock} {p.unit}</span>
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                {p.retailPrice.toLocaleString()} CFA
                              </p>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                {p.storeName || 'Toutes boutiques'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: USER ACTIVITY & SALES INVOICES */}
              {modalTab === 'activity' && editingUser && (
                <div className="space-y-4">
                  {(() => {
                    const uInvs = invoices.filter(
                      inv => inv.createdBy === editingUser.name || inv.userId === editingUser.id
                    );
                    const totalSales = uInvs.reduce((a, b) => a + b.totalAmount, 0);
                    const totalPaid = uInvs.reduce((a, b) => a + b.paidAmount, 0);
                    const totalRemaining = uInvs.reduce((a, b) => a + b.remainingAmount, 0);

                    return (
                      <>
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                              Total CA Réalisé
                            </p>
                            <p className="text-sm font-extrabold text-emerald-900 dark:text-emerald-200">
                              {totalSales.toLocaleString()} CFA
                            </p>
                          </div>

                          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                              Encaissé / Perçu
                            </p>
                            <p className="text-sm font-extrabold text-blue-900 dark:text-blue-200">
                              {totalPaid.toLocaleString()} CFA
                            </p>
                          </div>

                          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl">
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                              Reste À Recouvrer
                            </p>
                            <p className="text-sm font-extrabold text-rose-900 dark:text-rose-200">
                              {totalRemaining.toLocaleString()} CFA
                            </p>
                          </div>
                        </div>

                        {/* Invoice Table */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                          <div className="p-2.5 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                            <span>Factures Émises ({uInvs.length})</span>
                          </div>

                          <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-60 overflow-y-auto">
                            {uInvs.length === 0 ? (
                              <p className="p-4 text-center text-xs text-slate-400">
                                Aucune facture n'a encore été créée par cet utilisateur.
                              </p>
                            ) : (
                              uInvs.map(inv => (
                                <div key={inv.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                                  <div>
                                    <p className="font-bold text-slate-900 dark:text-white font-mono">
                                      {inv.invoiceNumber}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      Client: {inv.customerName} | {inv.date}
                                    </p>
                                  </div>

                                  <div className="text-right">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                      {inv.totalAmount.toLocaleString()} CFA
                                    </p>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                        inv.status === 'paid'
                                          ? 'bg-emerald-100 text-emerald-700'
                                          : inv.status === 'partial'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-rose-100 text-rose-700'
                                      }`}
                                    >
                                      {inv.status.toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                {editingUser ? 'Enregistrer les modifications' : "Créer l'utilisateur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Activity Modal */}
      {activityModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={activityModalUser.avatar}
                  alt={activityModalUser.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20"
                />
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Activité & Factures : {activityModalUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Boutique: {activityModalUser.storeName || 'Boutique Principale'} | Rôle: {activityModalUser.role.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActivityModalUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {(() => {
              const uInvs = invoices.filter(
                inv => inv.createdBy === activityModalUser.name || inv.userId === activityModalUser.id
              );
              const totalSales = uInvs.reduce((a, b) => a + b.totalAmount, 0);
              const totalPaid = uInvs.reduce((a, b) => a + b.paidAmount, 0);
              const totalRemaining = uInvs.reduce((a, b) => a + b.remainingAmount, 0);

              // Assigned products
              const userAssignedProducts = activityModalUser.assignedProductIds
                ? products.filter(p => activityModalUser.assignedProductIds?.includes(p.id))
                : [];

              return (
                <div className="space-y-4">
                  {/* Performance Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                        Chiffre d'Affaires Réalisé
                      </p>
                      <p className="text-lg font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">
                        {totalSales.toLocaleString()} CFA
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                        {uInvs.length} facture(s) créée(s)
                      </p>
                    </div>

                    <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                        Paiements Encaissés
                      </p>
                      <p className="text-lg font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">
                        {totalPaid.toLocaleString()} CFA
                      </p>
                    </div>

                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl">
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                        Créances / Impayés
                      </p>
                      <p className="text-lg font-extrabold text-rose-900 dark:text-rose-200 mt-0.5">
                        {totalRemaining.toLocaleString()} CFA
                      </p>
                    </div>
                  </div>

                  {/* Products Assigned list */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-blue-600" />
                        <span>Produits Attribués à cet Utilisateur ({userAssignedProducts.length})</span>
                      </h4>
                      <button
                        onClick={() => {
                          const targetUser = activityModalUser;
                          setActivityModalUser(null);
                          handleOpenEdit(targetUser, 'products');
                        }}
                        className="text-xs text-indigo-600 hover:underline font-bold cursor-pointer"
                      >
                        Gérer les attribution →
                      </button>
                    </div>

                    {userAssignedProducts.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Aucun produit spécifique n'a été attribué. Cet utilisateur a accès à tous les produits de sa boutique.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
                        {userAssignedProducts.map(p => (
                          <span
                            key={p.id}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                          >
                            {p.name} ({p.currentStock} {p.unit})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Factures Table */}
                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        <span>Historique des Factures Générées ({uInvs.length})</span>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-700/60 max-h-72 overflow-y-auto">
                      {uInvs.length === 0 ? (
                        <p className="p-6 text-center text-xs text-slate-400">
                          Aucune facture n'a encore été enregistrée par cet utilisateur.
                        </p>
                      ) : (
                        uInvs.map(inv => (
                          <div key={inv.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/40">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white font-mono">
                                {inv.invoiceNumber}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Client : <strong>{inv.customerName}</strong> ({inv.customerPhone}) | {inv.date}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-bold text-slate-900 dark:text-white">
                                {inv.totalAmount.toLocaleString()} CFA
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Payé: {inv.paidAmount.toLocaleString()} CFA
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Supprimer l'utilisateur ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong className="text-slate-800 dark:text-slate-200">"{userToDelete.name}"</strong> ({userToDelete.email}) ?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
