import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  Building,
  DollarSign
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { PaymentMethod } from '../../types/erp';

export const PaymentsView: React.FC = () => {
  const { payments, companySettings, addPayment, invoices, purchases, customers, suppliers } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // New Payment Form
  const [newType, setNewType] = useState<'sale' | 'purchase'>('sale');
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');

  const filteredPayments = payments.filter(p => {
    const matchesQuery =
      p.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.targetNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
    return matchesQuery && matchesType && matchesMethod;
  });

  const totalReceived = payments.filter(p => p.type === 'sale').reduce((acc, p) => acc + p.amount, 0);
  const totalPaidOut = payments.filter(p => p.type === 'purchase').reduce((acc, p) => acc + p.amount, 0);
  const netCashFlow = totalReceived - totalPaidOut;

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return alert('Veuillez saisir un montant supérieur à 0');

    let entityId = '';
    let entityName = '';
    let targetNumber = '';

    if (newType === 'sale') {
      const inv = invoices.find(i => i.id === targetId);
      if (!inv) return alert('Veuillez sélectionner une facture');
      entityId = inv.customerId;
      entityName = inv.customerName;
      targetNumber = inv.invoiceNumber;
    } else {
      const pur = purchases.find(p => p.id === targetId);
      if (!pur) return alert('Veuillez sélectionner une commande achat');
      entityId = pur.supplierId;
      entityName = pur.supplierName;
      targetNumber = pur.orderNumber;
    }

    addPayment({
      date: new Date().toISOString().split('T')[0],
      type: newType,
      targetId,
      targetNumber,
      entityId,
      entityName,
      amount,
      paymentMethod,
      notes,
      receivedBy: 'Utilisateur Actif'
    });

    setIsNewModalOpen(false);
    setAmount(0);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Paiements & Trésorerie
            </h2>
            <p className="text-xs text-slate-500">
              Historique des reçus d'encaissement et règlements fournisseurs.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Règlement</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Total Encaissé (Ventes)</span>
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalReceived.toLocaleString()} {companySettings.currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span>Total Décaissé (Achats)</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalPaidOut.toLocaleString()} {companySettings.currencySymbol}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Flux Net de Caisse</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className={`text-xl font-extrabold mt-1 ${netCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {netCashFlow.toLocaleString()} {companySettings.currencySymbol}
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par n° reçus, n° facture/commande, tiers..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
          >
            <option value="all">Tous les flux</option>
            <option value="sale">Encaissements (Ventes)</option>
            <option value="purchase">Décaissements (Achats)</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-medium"
          >
            <option value="all">Tous les modes</option>
            <option value="cash">Espèces</option>
            <option value="mobile_money">Wave / Orange Money</option>
            <option value="bank_transfer">Virement Bancaire</option>
            <option value="check">Chèque</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/60 uppercase font-bold text-[10px] text-slate-500 tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Réf. Reçu</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Type & Réf Pièce</th>
                <th className="p-3.5">Client / Fournisseur</th>
                <th className="p-3.5">Mode de Règlement</th>
                <th className="p-3.5 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Aucun paiement enregistré pour cette recherche.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white font-mono">
                      {p.reference}
                    </td>
                    <td className="p-3.5 text-slate-500">{p.date}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.type === 'sale'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                        }`}>
                          {p.type === 'sale' ? 'Recette' : 'Dépense'}
                        </span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{p.targetNumber}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-900 dark:text-white">
                      {p.entityName}
                    </td>
                    <td className="p-3.5 capitalize font-medium">
                      {p.paymentMethod === 'mobile_money' ? 'Wave / Mobile Money' : p.paymentMethod}
                    </td>
                    <td className={`p-3.5 text-right font-bold text-sm ${
                      p.type === 'sale' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {p.type === 'sale' ? '+' : '-'}{p.amount.toLocaleString()} {companySettings.currencySymbol}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Payment Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Enregistrer un Règlement / Reçu
            </h3>

            <form onSubmit={handleCreatePayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Type de Flux</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewType('sale'); setTargetId(''); }}
                    className={`py-2 rounded-xl font-bold border text-xs transition-colors ${
                      newType === 'sale'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Encaissement (Vente)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewType('purchase'); setTargetId(''); }}
                    className={`py-2 rounded-xl font-bold border text-xs transition-colors ${
                      newType === 'purchase'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Décaissement (Achat)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {newType === 'sale' ? 'Facture Concernée' : 'Commande d\'Achat Concernée'}
                </label>
                <select
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-slate-900 dark:text-white font-medium"
                  required
                >
                  <option value="">-- Sélectionner une pièce --</option>
                  {newType === 'sale'
                    ? invoices.map(i => (
                        <option key={i.id} value={i.id}>
                          {i.invoiceNumber} - {i.customerName} (Reste: {i.remainingAmount.toLocaleString()} CFA)
                        </option>
                      ))
                    : purchases.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.orderNumber} - {p.supplierName} (Reste: {p.remainingAmount.toLocaleString()} CFA)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Montant Reglé ({companySettings.currencySymbol})</label>
                <input
                  type="number"
                  value={amount || ''}
                  onChange={e => setAmount(Number(e.target.value))}
                  placeholder="ex: 50000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mode de Paiement</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="cash">Espèces</option>
                  <option value="mobile_money">Wave / Mobile Money</option>
                  <option value="bank_transfer">Virement Bancaire</option>
                  <option value="check">Chèque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Observation</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Remarques..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-500 hover:text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
