import React, { useState } from 'react';
import {
  Settings,
  Building,
  Save,
  Download,
  Upload,
  CheckCircle2,
  Database,
  Image as ImageIcon,
  Trash2,
  FileText,
  Sparkles
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const SettingsView: React.FC = () => {
  const { companySettings, updateCompanySettings, exportDatabaseBackup } = useERP();

  const [activeTab, setActiveTab] = useState<'general' | 'logo' | 'backup'>('general');
  const [formData, setFormData] = useState({ ...companySettings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier image est trop volumineux (max 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData(prev => ({ ...prev, logo: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Paramètres de l'Entreprise & Factures
            </h2>
            <p className="text-xs text-slate-500">
              Coordonnées légales, logo officiel de facture, devises et sauvegarde de données.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-bold rounded-xl animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paramètres enregistrés !</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'general'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Informations Légales</span>
        </button>

        <button
          onClick={() => setActiveTab('logo')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'logo'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Logo & En-tête Facture</span>
          {formData.logo && (
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Sauvegardes</span>
        </button>
      </div>

      {/* TAB 1: GENERAL LEGAL INFO */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-indigo-600 font-bold text-sm">
            <Building className="w-4 h-4" />
            <span>Raison Sociale & Coordonnées</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Raison Sociale / Nom Commercial
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Devise Principale
              </label>
              <select
                value={formData.currencySymbol}
                onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-bold"
              >
                <option value="CFA">Franc CFA (XOF/XAF)</option>
                <option value="€">Euro (€)</option>
                <option value="$">US Dollar ($)</option>
                <option value="MAD">Dirham Marocain (MAD)</option>
                <option value="DZD">Dinar Algérien (DZD)</option>
                <option value="TND">Dinar Tunisien (TND)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Téléphone Contact
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Officiel
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                NIF (Numéro d'Identification Fiscale)
              </label>
              <input
                type="text"
                value={formData.nif}
                onChange={e => setFormData({ ...formData, nif: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                RCCM (Registre du Commerce)
              </label>
              <input
                type="text"
                value={formData.rccm}
                onChange={e => setFormData({ ...formData, rccm: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Taux de TVA par Défaut (%)
              </label>
              <input
                type="number"
                value={formData.defaultVatRate}
                onChange={e => setFormData({ ...formData, defaultVatRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Adresse Physique
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ville
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Pays
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={e => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer la Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: LOGO & FACTURE */}
      {activeTab === 'logo' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <ImageIcon className="w-5 h-5" />
              <span>Logo Officiel & Affichage sur les Factures</span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Téléchargez l'image de votre logo depuis votre disque dur local (PNG, JPG, SVG, WEBP). Ce logo sera immédiatement affiché sur toutes vos <strong>factures imprimées, reçus et exports PDF</strong>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Logo Picker Controls */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" />
                <span>Sélectionner une Image Locale</span>
              </h4>

              <div className="space-y-3">
                <label
                  htmlFor="logo-file-input"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Parcourir mon ordinateur...</span>
                  <input
                    type="file"
                    id="logo-file-input"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {formData.logo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="w-full py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer le Logo Actuel</span>
                  </button>
                )}
              </div>

              {/* Alternative Image URL */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  Ou coller une URL d'image externe :
                </label>
                <input
                  type="text"
                  placeholder="https://exemple.com/logo.png"
                  value={formData.logo}
                  onChange={e => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Live Invoice Header Preview */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold flex items-center gap-1.5 text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Aperçu sur Facture Officielle</span>
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full font-mono">En-tête PDF / Impression</span>
              </div>

              <div className="p-4 rounded-xl bg-white text-slate-900 shadow-lg space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    {formData.logo ? (
                      <img
                        src={formData.logo}
                        alt="Logo Aperçu"
                        className="w-14 h-14 object-contain rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-xs">
                        WAD
                      </div>
                    )}
                    <div>
                      <h3 className="font-black text-indigo-900 text-sm uppercase">{formData.name || 'Nom de la Société'}</h3>
                      <p className="text-[10px] text-slate-500">{formData.address || 'Adresse'}, {formData.city}</p>
                      <p className="text-[10px] text-slate-500">Tél: {formData.phone || '00 00 00 00'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-mono font-bold text-xs text-indigo-600">FACTURE #INV-2026</p>
                    <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded-full">
                      PAYÉE
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                ✓ L'image apparaît automatiquement en haut à gauche de toutes vos factures client.
              </p>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer le Logo</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700 text-purple-600 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Gestion de la Base de Données & Export JSON</span>
          </div>

          <p className="text-xs text-slate-500">
            Téléchargez et sauvegardez régulièrement l'intégralité de vos données d'exploitation (Produits, Ventes, Factures, Clients, Fournisseurs) sur votre ordinateur.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={exportDatabaseBackup}
              className="px-5 py-3 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger la Sauvegarde JSON Complete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
