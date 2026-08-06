import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  Filter,
  Printer,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Mail,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  X,
  User,
  Phone,
  ArrowUpDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { useERP } from '../../context/ERPContext';
import { DebtorCustomer, RiskLevel } from '../../types/erp';

export const DebtorsView: React.FC = () => {
  const { debtors, companySettings, invoices, addPayment, t } = useERP();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  // Modals state
  const [selectedDebtor, setSelectedDebtor] = useState<DebtorCustomer | null>(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Reminders text state
  const [reminderMsg, setReminderMsg] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'check' | 'mobile_money'>('cash');

  // Filter & Search
  const filteredDebtors = debtors.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.phone.includes(search) ||
      d.city.toLowerCase().includes(search.toLowerCase());

    const matchesRisk = riskFilter === 'all' || d.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  const totalReceivables = debtors.reduce((sum, d) => sum + d.remainingBalance, 0);

  // Trigger WhatsApp Reminder
  const handleOpenWhatsapp = (debtor: DebtorCustomer) => {
    setSelectedDebtor(debtor);
    const draft = `Bonjour M./Mme ${debtor.name},\n\nSauf erreur de notre part, votre compte présente un solde impayé de ${debtor.remainingBalance.toLocaleString()} ${companySettings.currencySymbol} auprès de ${companySettings.name} (Retard: ${debtor.overdueDays} jours).\n\nNous vous prions de bien vouloir procéder au règlement de vos factures dans les plus brefs délais.\n\nCordialement,\nService Comptabilité - ${companySettings.phone}`;
    setReminderMsg(draft);
    setWhatsappModalOpen(true);
  };

  const handleSendWhatsappRedirect = () => {
    if (!selectedDebtor) return;
    const cleanPhone = selectedDebtor.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(reminderMsg);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    setWhatsappModalOpen(false);
  };

  // Trigger Email Reminder
  const handleOpenEmail = (debtor: DebtorCustomer) => {
    setSelectedDebtor(debtor);
    const draft = `Objet: RAPPEL IMPAYÉ - Solde de ${debtor.remainingBalance.toLocaleString()} ${companySettings.currencySymbol}\n\nChèr(e) ${debtor.name},\n\nSauf erreur ou omis de notre part, le montant de ${debtor.remainingBalance.toLocaleString()} ${companySettings.currencySymbol} demeure impayé à ce jour sur votre compte client.\n\nNombre de factures impayées : ${debtor.unpaidInvoiceCount}\nNombre de jours de retard : ${debtor.overdueDays} jours.\n\nMerci de bien vouloir effectuer votre virement sur notre compte NIF ${companySettings.nif} ou de vous présenter en caisse.\n\nBien cordialement,\n${companySettings.name}\nTél: ${companySettings.phone}`;
    setReminderMsg(draft);
    setEmailModalOpen(true);
  };

  const handleSendEmailRedirect = () => {
    if (!selectedDebtor) return;
    const mailto = `mailto:${selectedDebtor.email}?subject=Rappel%20Factures%20Impayees&body=${encodeURIComponent(reminderMsg)}`;
    window.open(mailto, '_blank');
    setEmailModalOpen(false);
  };

  // Open Payment modal
  const handleOpenPayment = (debtor: DebtorCustomer) => {
    setSelectedDebtor(debtor);
    setPaymentAmount(debtor.remainingBalance);
    setPaymentModalOpen(true);
  };

  const handleRegisterPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtor || paymentAmount <= 0) return;

    // Find oldest unpaid invoice for customer
    const custUnpaidInvoices = invoices
      .filter(i => i.customerId === selectedDebtor.id && i.remainingAmount > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (custUnpaidInvoices.length > 0) {
      const targetInv = custUnpaidInvoices[0];
      addPayment({
        reference: `REC-2026-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        type: 'sale',
        targetId: targetInv.id,
        targetNumber: targetInv.invoiceNumber,
        entityId: selectedDebtor.id,
        entityName: selectedDebtor.name,
        amount: Math.min(paymentAmount, targetInv.remainingAmount),
        paymentMethod: paymentMethod,
        notes: `Règlement direct depuis la rubrique Clients Endettés`,
        receivedBy: 'Comptable',
      });
    }

    setPaymentModalOpen(false);
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredDebtors.map((d, idx) => ({
      Rang: idx + 1,
      Nom: d.name,
      Téléphone: d.phone,
      Email: d.email,
      'Dernière Facture': d.lastInvoiceDate,
      'Factures Impayées': d.unpaidInvoiceCount,
      'Montant Total Acheté (CFA)': d.totalPurchased,
      'Somme Payée (CFA)': d.totalPaid,
      'Solde Restant (CFA)': d.remainingBalance,
      'Retard (Jours)': d.overdueDays,
      'Niveau Risque': d.riskLevel === 'red' ? 'Critique' : d.riskLevel === 'orange' ? 'Moyen' : 'Faible',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients Endettés');
    XLSX.writeFile(wb, `Clients_Endettés_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`${companySettings.name} - RELEVÉ COMPLET DES CLIENTS ENDETTÉS`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Date d'exportation: ${new Date().toLocaleDateString('fr-FR')} | Total Créances: ${totalReceivables.toLocaleString()} ${companySettings.currencySymbol}`, 14, 22);

    let y = 32;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Client', 14, y);
    doc.text('Téléphone', 70, y);
    doc.text('Factures', 110, y);
    doc.text('Total Acheté', 140, y);
    doc.text('Solde Restant', 180, y);
    doc.text('Retard', 230, y);
    doc.text('Risque', 260, y);

    doc.line(14, y + 2, 280, y + 2);
    y += 8;

    doc.setFont('helvetica', 'normal');
    filteredDebtors.forEach(d => {
      if (y > 185) {
        doc.addPage();
        y = 20;
      }
      doc.text(d.name.substring(0, 30), 14, y);
      doc.text(d.phone, 70, y);
      doc.text(String(d.unpaidInvoiceCount), 110, y);
      doc.text(`${d.totalPurchased.toLocaleString()} CFA`, 140, y);
      doc.text(`${d.remainingBalance.toLocaleString()} CFA`, 180, y);
      doc.text(`${d.overdueDays}j`, 230, y);
      doc.text(d.riskLevel.toUpperCase(), 260, y);
      y += 7;
    });

    doc.save(`Relevé_Clients_Endettés_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600/90 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-900/50 animate-pulse">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-rose-500/30 text-rose-300 rounded border border-rose-500/40">
                Rubrique Prioritaire
              </span>
            </div>
            <h2 className="text-xl font-black mt-0.5">Clients Endettés & Recouvrement</h2>
            <p className="text-xs text-rose-200/80 mt-0.5">
              Suivi exclusif des comptes clients ayant un reste à payer supérieur à zéro.
            </p>
          </div>
        </div>

        {/* Global Receivables Metric */}
        <div className="bg-slate-900/90 p-3.5 rounded-xl border border-rose-800/60 text-right">
          <span className="text-xs text-rose-300 font-medium">Montant Total Créances</span>
          <p className="text-2xl font-black text-rose-400">
            {totalReceivables.toLocaleString()} <span className="text-sm font-bold">{companySettings.currencySymbol}</span>
          </p>
        </div>
      </div>

      {/* Action Bar: Search & Risk Filters & Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom de client, téléphone, ville..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Risk Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setRiskFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
              riskFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Tous ({debtors.length})
          </button>
          <button
            onClick={() => setRiskFilter('red')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              riskFilter === 'red'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Critique (&gt;30j)
          </button>
          <button
            onClick={() => setRiskFilter('orange')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              riskFilter === 'orange'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Moyen (15-30j)
          </button>
          <button
            onClick={() => setRiskFilter('green')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              riskFilter === 'green'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Normal (&lt;15j)
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={handleExportExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700"
            title="Imprimer"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Debtors Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Rang & Client</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Dernière Facture</th>
                <th className="py-3.5 px-4 text-center">Factures Impayées</th>
                <th className="py-3.5 px-4 text-right">Montant Total</th>
                <th className="py-3.5 px-4 text-right">Somme Payée</th>
                <th className="py-3.5 px-4 text-right font-black text-rose-600">Solde Restant</th>
                <th className="py-3.5 px-4 text-center">Jours Retard</th>
                <th className="py-3.5 px-4 text-center">Niveau Risque</th>
                <th className="py-3.5 px-4 text-right">Relance & Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    Aucun client endetté ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredDebtors.map((debtor, index) => (
                  <tr
                    key={debtor.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors"
                  >
                    {/* Client Name & Rank */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{debtor.name}</p>
                          <p className="text-[10px] text-slate-400">{debtor.neighborhood}, {debtor.city}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
                        {debtor.phone}
                      </span>
                    </td>

                    {/* Last Invoice */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-500">{debtor.lastInvoiceDate}</span>
                    </td>

                    {/* Unpaid Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400">
                        {debtor.unpaidInvoiceCount} fact.
                      </span>
                    </td>

                    {/* Total Purchased */}
                    <td className="py-3.5 px-4 text-right font-medium">
                      {debtor.totalPurchased.toLocaleString()} CFA
                    </td>

                    {/* Total Paid */}
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400 font-semibold">
                      {debtor.totalPaid.toLocaleString()} CFA
                    </td>

                    {/* Remaining Debt Balance */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                        {debtor.remainingBalance.toLocaleString()} {companySettings.currencySymbol}
                      </span>
                    </td>

                    {/* Overdue Days */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {debtor.overdueDays} jours
                      </span>
                    </td>

                    {/* Risk Level Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {debtor.riskLevel === 'red' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-600 text-white flex items-center justify-center gap-1 shadow-2xs">
                          <AlertTriangle className="w-3 h-3" /> Rouge
                        </span>
                      )}
                      {debtor.riskLevel === 'orange' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-amber-500 text-white flex items-center justify-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3" /> Orange
                        </span>
                      )}
                      {debtor.riskLevel === 'green' && (
                        <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-500 text-white flex items-center justify-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3" /> Vert
                        </span>
                      )}
                    </td>

                    {/* Relance & Payment Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenWhatsapp(debtor)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-2xs"
                          title="Relance WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEmail(debtor)}
                          className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-2xs"
                          title="Relance Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenPayment(debtor)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs flex items-center gap-1"
                          title="Enregistrer un Règlement"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Payer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {whatsappModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-emerald-600 text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold text-sm">Relance WhatsApp - {selectedDebtor.name}</h3>
              </div>
              <button onClick={() => setWhatsappModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500">
                Modifiez le message si besoin avant d'envoyer directement vers l'application WhatsApp ({selectedDebtor.phone}) :
              </p>
              <textarea
                value={reminderMsg}
                onChange={e => setReminderMsg(e.target.value)}
                rows={6}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setWhatsappModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSendWhatsappRedirect}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Ouvrir WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {emailModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-blue-600 text-white">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                <h3 className="font-bold text-sm">Relance par Email - {selectedDebtor.name}</h3>
              </div>
              <button onClick={() => setEmailModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500">
                Aperçu et modification du courrier électronique d'avertissement ({selectedDebtor.email}) :
              </p>
              <textarea
                value={reminderMsg}
                onChange={e => setReminderMsg(e.target.value)}
                rows={7}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSendEmailRedirect}
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer le Mail</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Quick Modal */}
      {paymentModalOpen && selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in duration-150">
            <div className="flex items-center justify-between p-4 bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <h3 className="font-bold text-sm">Saisir Règlement Client - {selectedDebtor.name}</h3>
              </div>
              <button onClick={() => setPaymentModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPaymentSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                  <span>Solde Impayé Actuel :</span>
                  <span className="font-bold text-rose-600">{selectedDebtor.remainingBalance.toLocaleString()} CFA</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Factures non réglées :</span>
                  <span>{selectedDebtor.unpaidInvoiceCount}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Montant Versé ({companySettings.currencySymbol})
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedDebtor.remainingBalance}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mode de Règlement
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="cash">Espèces (Comptant)</option>
                  <option value="transfer">Virement Bancaire</option>
                  <option value="check">Chèque</option>
                  <option value="mobile_money">Mobile Money (Wave / Orange)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Valider le Paiement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
