import React, { useState } from 'react';
import { ShoppingBag, Plus, Search, Trash2, X, CheckCircle2, FileText, Truck, ArrowRight } from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PurchaseItem, Supplier } from '../../types/erp';

export const PurchasesView: React.FC = () => {
  const { purchases, suppliers, products, createPurchaseOrder, companySettings, t } = useERP();

  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Purchase Form State
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const handleOpenNewPO = () => {
    setSupplierId(suppliers[0]?.id || '');
    setItems([]);
    setDiscountAmount(0);
    setPaidAmount(0);
    setNotes('');
    setModalOpen(true);
  };

  const handleAddItem = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const cost = itemCost > 0 ? itemCost : prod.buyPrice;
    const vatRate = prod.vatRate;
    const subtotal = itemQty * cost;
    const itemTotal = subtotal + (subtotal * vatRate) / 100;

    const newItem: PurchaseItem = {
      id: 'po-item-' + Date.now(),
      productId: prod.id,
      productCode: prod.code,
      productName: prod.name,
      unit: prod.unit,
      quantity: itemQty,
      unitCost: cost,
      vatRate: vatRate,
      discount: 0,
      total: itemTotal,
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const vatAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitCost * item.vatRate) / 100, 0);
  const grandTotal = Math.max(0, subtotal + vatAmount - discountAmount);
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Veuillez ajouter au moins un produit au bon d\'achat.');
      return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    createPurchaseOrder({
      date: new Date().toISOString().split('T')[0],
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: items,
      subtotal: subtotal,
      vatAmount: vatAmount,
      discountAmount: discountAmount,
      totalAmount: grandTotal,
      paidAmount: paidAmount,
      remainingAmount: remainingAmount,
      status: remainingAmount === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      notes: notes,
      createdBy: 'Magasinier',
    });

    setModalOpen(false);
  };

  const filteredPurchases = purchases.filter(
    po =>
      po.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Bons d'Achat & Réapprovisionnement
            </h2>
            <p className="text-xs text-slate-500">
              Commandes fournisseurs, entrées automatiques en stock et dettes.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenNewPO}
          className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Bon d'Achat</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un bon d'achat, fournisseur..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
        />
      </div>

      {/* Purchases List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">N° Bon d'Achat</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Fournisseur</th>
                <th className="py-3.5 px-4 text-center">Articles</th>
                <th className="py-3.5 px-4 text-right">Montant Total</th>
                <th className="py-3.5 px-4 text-right">Montant Payé</th>
                <th className="py-3.5 px-4 text-right">Reste à Payer</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredPurchases.map(po => (
                <tr key={po.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {po.orderNumber}
                  </td>
                  <td className="py-3.5 px-4">{po.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {po.supplierName}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium">
                      {po.items.length} produit(s)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {po.totalAmount.toLocaleString()} CFA
                  </td>
                  <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                    {po.paidAmount.toLocaleString()} CFA
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-amber-600 dark:text-amber-400">
                    {po.remainingAmount.toLocaleString()} CFA
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {po.status === 'paid' ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Payée
                      </span>
                    ) : po.status === 'partial' ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        Partielle
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        Non Payée
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in my-8">
            <div className="flex items-center justify-between p-4 bg-indigo-600 text-white">
              <h3 className="font-bold text-sm">Nouveau Bon d'Achat (Approvisionnement)</h3>
              <button onClick={() => setModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="p-6 space-y-4">
              {/* Supplier Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Fournisseur
                </label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-semibold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Product Row */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ajouter un produit à la commande
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <select
                      value={selectedProductId}
                      onChange={e => {
                        setSelectedProductId(e.target.value);
                        const p = products.find(prod => prod.id === e.target.value);
                        if (p) setItemCost(p.buyPrice);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg outline-none text-slate-900 dark:text-white"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.code} - Stock: {p.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={e => setItemQty(Number(e.target.value))}
                      placeholder="Qté"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 font-bold">
                    <tr>
                      <th className="p-2.5">Produit</th>
                      <th className="p-2.5 text-center">Qté</th>
                      <th className="p-2.5 text-right">Prix Achat</th>
                      <th className="p-2.5 text-right">Total</th>
                      <th className="p-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400">
                          Aucun produit ajouté au bon d'achat.
                        </td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <tr key={item.id}>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                            {item.productName}
                          </td>
                          <td className="p-2.5 text-center font-semibold">{item.quantity} {item.unit}</td>
                          <td className="p-2.5 text-right">{item.unitCost.toLocaleString()} CFA</td>
                          <td className="p-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                            {item.total.toLocaleString()} CFA
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payments */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Sous-total HT :</span>
                  <span className="font-bold">{subtotal.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>TVA estimée :</span>
                  <span>{vatAmount.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t pt-2 border-slate-200 dark:border-slate-700">
                  <span>GRAND TOTAL ACHAT :</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{grandTotal.toLocaleString()} CFA</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Acompte Versé au Fournisseur (CFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={grandTotal}
                      value={paidAmount}
                      onChange={e => setPaidAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 rounded-lg outline-none font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Solde Dette Fournisseur Générée
                    </label>
                    <div className="px-3 py-1.5 text-xs bg-amber-50 dark:bg-amber-950/40 font-bold text-amber-600 rounded-lg">
                      {remainingAmount.toLocaleString()} CFA
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Valider Bon d'Achat & Entrée Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
