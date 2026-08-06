import React, { useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  Download,
  FileSpreadsheet,
  Plus,
  Eye,
  DollarSign,
  Share2,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Send,
  User as UserIcon,
  Store
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useERP } from '../../context/ERPContext';
import { Invoice } from '../../types/erp';

export const InvoicesView: React.FC = () => {
  const { invoices, addPaymentToInvoice, companySettings, currentUser, users, t } = useERP();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Selected Invoice for View/Print Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment Modal State
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');

  // Filter Invoices
  const filtered = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerPhone.includes(search) ||
      inv.createdBy.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

    let matchesUser = true;
    if (currentUser?.role !== 'admin') {
      matchesUser =
        inv.createdBy === currentUser?.name ||
        inv.userId === currentUser?.id ||
        inv.storeName === currentUser?.storeName;
    } else if (userFilter !== 'all') {
      matchesUser = inv.createdBy === userFilter || inv.userId === userFilter;
    }

    return matchesSearch && matchesStatus && matchesUser;
  });

  // Export Excel
  const handleExportExcel = () => {
    const data = invoices.map(i => ({
      'N° Facture': i.invoiceNumber,
      Date: i.date,
      Client: i.customerName,
      Téléphone: i.customerPhone,
      Type: i.saleType === 'wholesale' ? 'Vente Gros' : 'Vente Détail',
      'Montant Total (CFA)': i.totalAmount,
      'Montant Payé (CFA)': i.paidAmount,
      'Solde Restant (CFA)': i.remainingAmount,
      Statut: i.status === 'paid' ? 'Payée' : i.status === 'partial' ? 'Partielle' : 'Non Payée',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Factures Vente');
    XLSX.writeFile(wb, `Factures_Ventes_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Generate jsPDF Document
  const handleExportPDF = (inv: Invoice) => {
    const doc = new jsPDF();

    // Background header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');

    // White title in header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companySettings.name.toUpperCase(), 14, 18);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${companySettings.address} - ${companySettings.city}, ${companySettings.country} | Tél: ${companySettings.phone}`, 14, 25);

    // Invoice title block on right
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`FACTURE N° ${inv.invoiceNumber}`, 140, 18);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date : ${inv.date} | Statut : ${inv.status.toUpperCase()}`, 140, 25);

    // Reset text color
    doc.setTextColor(30, 41, 59);

    let startY = 40;

    // Company Logo if present
    if (companySettings.logo && companySettings.logo.startsWith('data:image')) {
      try {
        const format = companySettings.logo.includes('image/png') ? 'PNG' : 'JPEG';
        doc.addImage(companySettings.logo, format, 14, startY, 22, 22);
        startY += 26;
      } catch (err) {
        console.warn('Could not add logo to PDF:', err);
      }
    }

    // Customer Info Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, startY, 182, 24, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURÉ À :', 18, startY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client : ${inv.customerName}`, 18, startY + 15);
    doc.text(`Téléphone : ${inv.customerPhone}`, 18, startY + 20);

    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS VENTE :', 120, startY + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type : ${inv.saleType === 'wholesale' ? 'Vente en Gros' : 'Vente au Détail'}`, 120, startY + 15);
    doc.text(`Établi par : ${inv.createdBy || 'Administration'}`, 120, startY + 20);

    // Items Table Header
    let y = startY + 32;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Réf / Désignation Article', 18, y + 5.5);
    doc.text('Qté', 115, y + 5.5);
    doc.text('Prix Unit.', 140, y + 5.5);
    doc.text('Total HT', 172, y + 5.5);

    y += 12;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');

    inv.items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 8, 'F');
      }
      doc.text(item.productName, 18, y);
      doc.text(`${item.quantity} ${item.unit}`, 115, y);
      doc.text(`${item.unitPrice.toLocaleString()} ${companySettings.currencySymbol}`, 140, y);
      doc.text(`${item.subtotal.toLocaleString()} ${companySettings.currencySymbol}`, 172, y);
      y += 8;
    });

    // Totals
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Sous-total HT :`, 125, y);
    doc.text(`${inv.subtotal.toLocaleString()} ${companySettings.currencySymbol}`, 172, y);
    y += 6;

    doc.text(`TVA (${companySettings.defaultVatRate}%) :`, 125, y);
    doc.text(`${inv.vatAmount.toLocaleString()} ${companySettings.currencySymbol}`, 172, y);
    y += 8;

    doc.setFillColor(238, 242, 255);
    doc.rect(122, y - 5, 74, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(49, 46, 129);
    doc.text(`TOTAL FACTURE :`, 125, y + 1);
    doc.text(`${inv.totalAmount.toLocaleString()} ${companySettings.currencySymbol}`, 170, y + 1);

    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(`Montant Encaissé : ${inv.paidAmount.toLocaleString()} ${companySettings.currencySymbol}`, 125, y);

    if (inv.remainingAmount > 0) {
      y += 6;
      doc.setTextColor(225, 29, 72);
      doc.setFont('helvetica', 'bold');
      doc.text(`Solde Dû Restant : ${inv.remainingAmount.toLocaleString()} ${companySettings.currencySymbol}`, 125, y);
    }

    // Footer
    y += 20;
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Merci pour votre confiance. Facture édité par le système WAD-ALGONI ERP.', 105, y, { align: 'center' });

    // Save
    doc.save(`Facture_${inv.invoiceNumber}.pdf`);
  };

  // WhatsApp Share
  const handleShareWhatsApp = (inv: Invoice) => {
    const text = `Bonjour ${inv.customerName}, voici le récapitulatif de votre facture N° *${inv.invoiceNumber}* émise par ${companySettings.name}.\n\n` +
      `Montant Total: *${inv.totalAmount.toLocaleString()} CFA*\n` +
      `Montant Payé: *${inv.paidAmount.toLocaleString()} CFA*\n` +
      `Solde Restant: *${inv.remainingAmount.toLocaleString()} CFA*\n\n` +
      `Merci pour votre confiance !`;
    const cleanPhone = inv.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Submit Payment
  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || paymentAmount <= 0) return;

    addPaymentToInvoice(paymentInvoice.id, paymentAmount, paymentMethod);
    setPaymentInvoice(null);
    setPaymentAmount(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Gestion des Factures Vente & Règlements
            </h2>
            <p className="text-xs text-slate-500">
              Imprimez, partagez par WhatsApp et enregistrez les encaissements.
            </p>
          </div>
        </div>

        <button
          onClick={handleExportExcel}
          className="px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par N° facture, nom de client, caissier..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* User Filter for Admin */}
        {currentUser?.role === 'admin' ? (
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl">
            <UserIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="w-full text-xs font-semibold bg-transparent text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">👥 Tous les utilisateurs</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>
                  👤 {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 border border-purple-200 dark:border-purple-800 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Store className="w-3.5 h-3.5 text-purple-600" />
            <span>Factures de : {currentUser?.name}</span>
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              statusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            Payées
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              statusFilter === 'partial' ? 'bg-amber-500 text-white' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            Partielles
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              statusFilter === 'unpaid' ? 'bg-rose-600 text-white' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            Impayées
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">N° Facture</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Type Vente</th>
                <th className="py-3.5 px-4 text-right">Montant Total</th>
                <th className="py-3.5 px-4 text-right">Montant Payé</th>
                <th className="py-3.5 px-4 text-right">Solde Dû</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">{inv.date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    <p>{inv.customerName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{inv.customerPhone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${inv.saleType === 'wholesale' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {inv.saleType === 'wholesale' ? 'GROS' : 'DÉTAIL'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                    {inv.totalAmount.toLocaleString()} CFA
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {inv.paidAmount.toLocaleString()} CFA
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                    {inv.remainingAmount.toLocaleString()} CFA
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {inv.status === 'paid' ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Payée
                      </span>
                    ) : inv.status === 'partial' ? (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                        Partielle
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        Non Payée
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Voir & Imprimer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleExportPDF(inv)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Télécharger PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(inv)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="Relancer via WhatsApp"
                      >
                        <Send className="w-4 h-4" />
                      </button>

                      {inv.remainingAmount > 0 && (
                        <button
                          onClick={() => {
                            setPaymentInvoice(inv);
                            setPaymentAmount(inv.remainingAmount);
                          }}
                          className="px-2 py-1 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs"
                          title="Enregistrer un versement"
                        >
                          Régler
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail / Print Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in my-8">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden">
              <h3 className="font-bold text-sm">Facture Officielle #{selectedInvoice.invoiceNumber}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer</span>
                </button>
                <button
                  onClick={() => handleExportPDF(selectedInvoice)}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-white hover:opacity-80">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Paper Container */}
            <div className="p-8 bg-white text-slate-900 space-y-6 text-xs print:p-0">
              {/* Top Company Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div className="flex items-start gap-4">
                  {companySettings.logo ? (
                    <img
                      src={companySettings.logo}
                      alt="Logo Entreprise"
                      className="w-20 h-20 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-indigo-900 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                      WAD
                    </div>
                  )}

                  <div>
                    <h1 className="text-2xl font-black text-indigo-950 uppercase tracking-tight">
                      {companySettings.name}
                    </h1>
                    <p className="text-slate-600 text-xs mt-1 font-medium">
                      {companySettings.address} — {companySettings.city}, {companySettings.country}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Tél : <span className="font-bold text-slate-700">{companySettings.phone}</span> | Email : {companySettings.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                      <span>NIF : {companySettings.nif}</span>
                      <span>•</span>
                      <span>RCCM : {companySettings.rccm}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-black text-xs rounded-lg uppercase tracking-wider font-mono">
                    FACTURE OFFICIELLE
                  </div>
                  <p className="font-mono font-black text-indigo-600 text-base">#{selectedInvoice.invoiceNumber}</p>
                  <p className="text-slate-500 text-xs">Date : <strong className="text-slate-800">{selectedInvoice.date}</strong></p>
                  <div>
                    <span className={`inline-flex items-center gap-1 mt-1.5 px-3 py-1 text-xs font-bold rounded-full uppercase shadow-2xs ${
                      selectedInvoice.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{selectedInvoice.status === 'paid' ? 'FACTURE PAYÉE' : 'SOLDE RESTANT DÛ'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">FACTURÉ À :</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">{selectedInvoice.customerName}</p>
                  <p className="text-slate-500 text-xs">Tél : {selectedInvoice.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">DÉTAILS DE VENTE :</p>
                  <p className="font-bold text-indigo-600 uppercase text-xs mt-0.5">
                    {selectedInvoice.saleType === 'wholesale' ? 'PRIX DE GROS' : 'PRIX AU DÉTAIL'}
                  </p>
                  <p className="text-slate-500 text-[11px]">Établi par : <span className="font-semibold">{selectedInvoice.createdBy || 'Administration'}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr>
                      <th className="p-3">Article / Désignation</th>
                      <th className="p-3 text-center">Quantité</th>
                      <th className="p-3 text-right">Prix Unitaire</th>
                      <th className="p-3 text-right">Total HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/50' : ''}>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Code: {item.productCode}</p>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono">{item.quantity} {item.unit}</span>
                        </td>
                        <td className="p-3 text-right text-slate-600">{item.unitPrice.toLocaleString()} {companySettings.currencySymbol}</td>
                        <td className="p-3 text-right font-black text-slate-900">{item.subtotal.toLocaleString()} {companySettings.currencySymbol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-between items-end pt-2">
                <div className="w-1/2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-700">Conditions de règlement :</p>
                  <p>• Paiement à réception ou selon accord commercial enregistré.</p>
                  <p>• Les marchandises vendues ne sont ni reprises ni échangées après 48h.</p>
                </div>

                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total HT :</span>
                    <span className="font-bold">{selectedInvoice.subtotal.toLocaleString()} {companySettings.currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>TVA ({companySettings.defaultVatRate}%) :</span>
                    <span>{selectedInvoice.vatAmount.toLocaleString()} {companySettings.currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-indigo-950 p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span>TOTAL FACTURE :</span>
                    <span className="text-indigo-600">{selectedInvoice.totalAmount.toLocaleString()} {companySettings.currencySymbol}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold px-1">
                    <span>Montant Encaissé :</span>
                    <span>{selectedInvoice.paidAmount.toLocaleString()} {companySettings.currencySymbol}</span>
                  </div>
                  {selectedInvoice.remainingAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold text-xs p-2 bg-rose-50 border border-rose-200 rounded-xl">
                      <span>Solde Restant Dû :</span>
                      <span>{selectedInvoice.remainingAmount.toLocaleString()} {companySettings.currencySymbol}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stamp & Footer Legal */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 items-end">
                <div className="text-[10px] text-slate-400 space-y-0.5">
                  <p className="font-bold text-slate-600">{companySettings.name}</p>
                  <p>Système de gestion commerciale WAD-ALGONI ERP</p>
                  <p className="font-mono">Document officiel certifié</p>
                </div>

                <div className="text-right">
                  <div className="inline-block w-40 h-16 border border-dashed border-slate-300 rounded-xl p-2 text-[10px] text-slate-400 text-center">
                    Cachet & Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Deposit Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-emerald-600 text-white">
              <h3 className="font-bold text-sm">Enregistrer un Règlement / Encaisser</h3>
              <button onClick={() => setPaymentInvoice(null)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddPaymentSubmit} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Facture #{paymentInvoice.invoiceNumber}</p>
                <p className="text-slate-500">Client: {paymentInvoice.customerName}</p>
                <p className="text-rose-600 font-bold">Reste à Payer Actuel: {paymentInvoice.remainingAmount.toLocaleString()} CFA</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Montant du Versement (CFA)
                </label>
                <input
                  type="number"
                  max={paymentInvoice.remainingAmount}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mode de Paiement
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-xl outline-none text-slate-900 dark:text-white"
                >
                  <option value="cash">Espèces</option>
                  <option value="mobile_money">Wave / Orange Money</option>
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement Bancaire</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
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
