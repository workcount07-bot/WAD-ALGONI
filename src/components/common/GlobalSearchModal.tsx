import React, { useState, useEffect } from 'react';
import { Search, X, Package, FileText, User, ShoppingBag, FolderTree, ArrowRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';

export const GlobalSearchModal: React.FC = () => {
  const {
    globalSearchOpen,
    setGlobalSearchOpen,
    products,
    invoices,
    customers,
    suppliers,
    categories,
    setActiveTab,
    companySettings,
    currentUser
  } = useERP();

  const [query, setQuery] = useState('');

  // Handle keydown Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  if (!globalSearchOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const isUserAdmin = currentUser?.role === 'admin';
  const assignedIds = currentUser?.assignedProductIds || [];
  const visibleProducts = isUserAdmin ? products : products.filter(p => assignedIds.includes(p.id));

  const matchedProducts = trimmed
    ? visibleProducts.filter(
        p =>
          p.name.toLowerCase().includes(trimmed) ||
          p.code.toLowerCase().includes(trimmed) ||
          p.barcode.includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedInvoices = trimmed
    ? invoices.filter(
        i =>
          i.invoiceNumber.toLowerCase().includes(trimmed) ||
          i.customerName.toLowerCase().includes(trimmed) ||
          i.customerPhone.includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedCustomers = trimmed
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(trimmed) ||
          c.phone.includes(trimmed) ||
          c.email.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedSuppliers = trimmed
    ? suppliers.filter(
        s =>
          s.name.toLowerCase().includes(trimmed) ||
          s.phone.includes(trimmed) ||
          s.email.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedCategories = trimmed
    ? categories.filter(
        cat =>
          cat.name.toLowerCase().includes(trimmed) ||
          cat.code.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const totalResults =
    matchedProducts.length +
    matchedInvoices.length +
    matchedCustomers.length +
    matchedSuppliers.length +
    matchedCategories.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-700 gap-3">
          <Search className="w-5 h-5 text-indigo-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par produit, code-barres, n° facture, nom de client, téléphone..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400"
            autoFocus
          />
          <button
            onClick={() => setGlobalSearchOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar space-y-4 flex-1">
          {!trimmed && (
            <div className="py-8 text-center text-xs text-slate-400">
              Tapez au moins un mot-clé ou un numéro pour lancer la recherche en temps réel.
            </div>
          )}

          {trimmed && totalResults === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              Aucun résultat trouvé pour "{query}".
            </div>
          )}

          {/* Products Result */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <Package className="w-3.5 h-3.5 text-indigo-500" />
                <span>Produits ({matchedProducts.length})</span>
              </div>
              <div className="space-y-1">
                {matchedProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveTab('products');
                      setGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {p.photo ? (
                        <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs">
                          {p.code}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-500">
                          Code: {p.code} | Barcode: {p.barcode} | Stock: {p.currentStock} {p.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {p.retailPrice.toLocaleString()} {companySettings.currencySymbol}
                      </p>
                      <span className="text-[10px] text-slate-400">Détail</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Result */}
          {matchedInvoices.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>Factures ({matchedInvoices.length})</span>
              </div>
              <div className="space-y-1">
                {matchedInvoices.map(inv => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setActiveTab('invoices');
                      setGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-slate-500">
                        Client: {inv.customerName} ({inv.customerPhone}) | Date: {inv.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {inv.totalAmount.toLocaleString()} {companySettings.currencySymbol}
                      </p>
                      <span className={`text-[10px] font-bold ${inv.remainingAmount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {inv.remainingAmount > 0 ? `Reste: ${inv.remainingAmount.toLocaleString()} ${companySettings.currencySymbol}` : 'Payée'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Result */}
          {matchedCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Clients ({matchedCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {matchedCustomers.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveTab('customers');
                      setGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-500">
                        Tél: {c.phone} | Ville: {c.city}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suppliers Result */}
          {matchedSuppliers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                <span>Fournisseurs ({matchedSuppliers.length})</span>
              </div>
              <div className="space-y-1">
                {matchedSuppliers.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveTab('suppliers');
                      setGlobalSearchOpen(false);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-500">
                        Tél: {s.phone} | Solde Dette: {s.balance.toLocaleString()} {companySettings.currencySymbol}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
          <span>WAD-ALGONI Recherche Rapide</span>
          <span>Appuyez sur <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded">Echap</kbd> pour fermer</span>
        </div>
      </div>
    </div>
  );
};
