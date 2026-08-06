import React, { useState } from 'react';
import { Layers, Search, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useERP } from '../../context/ERPContext';

export const InventoryView: React.FC = () => {
  const { products, stockMovements, adjustStock, companySettings, currentUser } = useERP();

  const isUserAdmin = currentUser?.role === 'admin';
  const assignedIds = currentUser?.assignedProductIds || [];
  const visibleProducts = isUserAdmin
    ? products
    : products.filter(p => assignedIds.includes(p.id));

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Stock Adjustment Form
  const [selectedProductId, setSelectedProductId] = useState<string>(visibleProducts[0]?.id || '');
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [reasonInput, setReasonInput] = useState<string>('Inventaire physique annuel');

  const handleOpenAdjust = (prodId?: string) => {
    const p = visibleProducts.find(prod => prod.id === (prodId || selectedProductId)) || visibleProducts[0];
    if (p) {
      setSelectedProductId(p.id);
      setNewStockInput(p.currentStock);
    }
    setModalOpen(true);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    adjustStock(selectedProductId, newStockInput, reasonInput);
    setModalOpen(false);
  };

  const handleExportExcel = () => {
    const data = stockMovements.map(m => ({
      ID: m.id,
      Date: m.date,
      Produit: m.productName,
      Type: m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Ajustement',
      Quantité: m.quantity,
      'Ancien Stock': m.previousStock,
      'Nouveau Stock': m.newStock,
      Motif: m.reason,
      Operateur: m.performedBy,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mouvements Stock');
    XLSX.writeFile(wb, `Audit_Mouvements_Stock_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredMovements = stockMovements.filter(
    m =>
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.reason.toLowerCase().includes(search.toLowerCase()) ||
      m.performedBy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Journal des Mouvements & Audits Stock
            </h2>
            <p className="text-xs text-slate-500">
              Traçabilité en temps réel de chaque entrée, sortie et régularisation physique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Journal Excel</span>
          </button>

          <button
            onClick={() => handleOpenAdjust()}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Ajuster Un Stock</span>
          </button>
        </div>
      </div>

      {/* Stock Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">Valeur Totale du Stock (Achat)</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {visibleProducts.reduce((sum, p) => sum + p.currentStock * p.buyPrice, 0).toLocaleString()} {companySettings.currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">Valeur Potentielle (Vente Gros)</p>
          <p className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {visibleProducts.reduce((sum, p) => sum + p.currentStock * p.wholesalePrice, 0).toLocaleString()} {companySettings.currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <p className="text-xs text-slate-400 font-medium">Valeur Potentielle (Vente Détail)</p>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {visibleProducts.reduce((sum, p) => sum + p.currentStock * p.retailPrice, 0).toLocaleString()} {companySettings.currencySymbol}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer les mouvements par produit, motif ou opérateur..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
        />
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Date & Heure</th>
                <th className="py-3.5 px-4">Produit</th>
                <th className="py-3.5 px-4 text-center">Type Mouvement</th>
                <th className="py-3.5 px-4 text-center">Quantité</th>
                <th className="py-3.5 px-4 text-center">Ancien → Nouveau</th>
                <th className="py-3.5 px-4">Motif / Justificatif</th>
                <th className="py-3.5 px-4">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredMovements.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{m.date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{m.productName}</td>
                  <td className="py-3.5 px-4 text-center">
                    {m.type === 'in' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        <ArrowUpRight className="w-3 h-3" /> Entrée (Achat)
                      </span>
                    ) : m.type === 'out' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        <ArrowDownRight className="w-3 h-3" /> Sortie (Vente)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        <RefreshCw className="w-3 h-3" /> Ajustement
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-900 dark:text-white">
                    {m.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                    {m.previousStock} → <span className="font-bold text-indigo-600">{m.newStock}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{m.reason}</td>
                  <td className="py-3.5 px-4 text-[10px] text-slate-400 font-mono">{m.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-indigo-600 text-white">
              <h3 className="font-bold text-sm">Régularisation / Ajustement de Stock</h3>
              <button onClick={() => setModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Produit Concerné
                </label>
                <select
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value);
                    const p = visibleProducts.find(prod => prod.id === e.target.value);
                    if (p) setNewStockInput(p.currentStock);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl outline-none text-slate-900 dark:text-white font-semibold"
                >
                  {visibleProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock Actuel: {p.currentStock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nouveau Stock Physique Compté
                </label>
                <input
                  type="number"
                  min={0}
                  value={newStockInput}
                  onChange={e => setNewStockInput(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Motif de l'ajustement
                </label>
                <select
                  value={reasonInput}
                  onChange={e => setReasonInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl outline-none text-slate-900 dark:text-white"
                >
                  <option value="Inventaire physique de contrôle">Inventaire physique de contrôle</option>
                  <option value="Casse / Produit endommagé">Casse / Produit endommagé</option>
                  <option value="Perte ou vol constaté">Perte ou vol constaté</option>
                  <option value="Péremption d'article">Péremption d'article</option>
                  <option value="Correction d'erreur de saisie">Correction d'erreur de saisie</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Valider l'ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
