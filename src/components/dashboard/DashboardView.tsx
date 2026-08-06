import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Users,
  Truck,
  FileSpreadsheet,
  AlertOctagon,
  CreditCard,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useERP } from '../../context/ERPContext';

export const DashboardView: React.FC = () => {
  const {
    products,
    invoices,
    purchases,
    customers,
    suppliers,
    debtors,
    companySettings,
    setActiveTab,
    t
  } = useERP();

  const [timeFilter, setTimeFilter] = useState<'day' | 'month' | 'year'>('month');

  // Compute metrics
  const todayStr = '2026-08-04'; // Context date
  const monthStr = '2026-08';

  const todaySalesInvoices = invoices.filter(i => i.date === todayStr);
  const todayRevenue = todaySalesInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const monthSalesInvoices = invoices.filter(i => i.date.startsWith(monthStr) || i.date.startsWith('2026-07'));
  const monthRevenue = monthSalesInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.currentStock === 0).length;
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length;

  const totalCustomers = customers.length;
  const totalSuppliers = suppliers.length;
  const totalInvoices = invoices.length;
  const unpaidInvoicesCount = invoices.filter(i => i.remainingAmount > 0).length;

  const totalReceivables = debtors.reduce((sum, d) => sum + d.remainingBalance, 0);
  const totalSupplierDebts = suppliers.reduce((sum, s) => sum + s.balance, 0);

  // Top selling products computation
  const productSalesMap: Record<string, { name: string; qty: number; total: number; photo?: string }> = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        const prod = products.find(p => p.id === item.productId);
        productSalesMap[item.productId] = {
          name: item.productName,
          qty: 0,
          total: 0,
          photo: prod?.photo
        };
      }
      productSalesMap[item.productId].qty += item.quantity;
      productSalesMap[item.productId].total += item.total;
    });
  });

  const topSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Top Clients computation
  const clientPurchasesMap: Record<string, { name: string; invoiceCount: number; total: number; paid: number }> = {};
  invoices.forEach(inv => {
    if (!clientPurchasesMap[inv.customerId]) {
      clientPurchasesMap[inv.customerId] = {
        name: inv.customerName,
        invoiceCount: 0,
        total: 0,
        paid: 0,
      };
    }
    clientPurchasesMap[inv.customerId].invoiceCount += 1;
    clientPurchasesMap[inv.customerId].total += inv.totalAmount;
    clientPurchasesMap[inv.customerId].paid += inv.paidAmount;
  });

  const topClients = Object.values(clientPurchasesMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Chart Data Preparation
  const dailyData = [
    { label: 'Lun 28', ventes: 420000, achats: 150000, benefice: 120000 },
    { label: 'Mar 29', ventes: 580000, achats: 200000, benefice: 175000 },
    { label: 'Mer 30', ventes: 310000, achats: 80000, benefice: 90000 },
    { label: 'Jeu 31', ventes: 890000, achats: 450000, benefice: 240000 },
    { label: 'Ven 01', ventes: 1100000, achats: 300000, benefice: 380000 },
    { label: 'Sam 02', ventes: 640000, achats: 120000, benefice: 210000 },
    { label: 'Dim 03', ventes: 950000, achats: 250000, benefice: 310000 },
    { label: "Aujourd'hui", ventes: todayRevenue || 1250000, achats: 350000, benefice: 420000 },
  ];

  const monthlyData = [
    { label: 'Jan', ventes: 4200000, achats: 3100000, benefice: 1100000 },
    { label: 'Fév', ventes: 5800000, achats: 4200000, benefice: 1600000 },
    { label: 'Mar', ventes: 6100000, achats: 4000000, benefice: 2100000 },
    { label: 'Avr', ventes: 7400000, achats: 5200000, benefice: 2200000 },
    { label: 'Mai', ventes: 8900000, achats: 6100000, benefice: 2800000 },
    { label: 'Juin', ventes: 9200000, achats: 6500000, benefice: 2700000 },
    { label: 'Juil', ventes: 11500000, achats: 7800000, benefice: 3700000 },
    { label: 'Août', ventes: monthRevenue || 12800000, achats: 8400000, benefice: 4400000 },
  ];

  const stockEvolutionData = [
    { sem: 'Semaine 1', electronique: 45, materiaux: 850, alimentation: 320 },
    { sem: 'Semaine 2', electronique: 40, materiaux: 790, alimentation: 280 },
    { sem: 'Semaine 3', electronique: 32, materiaux: 680, alimentation: 210 },
    { sem: 'Semaine 4', electronique: 18, materiaux: 730, alimentation: 127 },
  ];

  const categoryDistribution = [
    { name: 'Électronique', value: 35, color: '#4F46E5' },
    { name: 'Matériaux', value: 30, color: '#F59E0B' },
    { name: 'Alimentation', value: 20, color: '#10B981' },
    { name: 'Textile', value: 10, color: '#8B5CF6' },
    { name: 'Cosmétiques', value: 5, color: '#EC4899' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Time Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              {t('syntheticView')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            {t('dashboardTitle')}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <Calendar className="w-4 h-4 text-indigo-400 ml-1.5" />
          <button
            onClick={() => setTimeFilter('day')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeFilter === 'day' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('day')}
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeFilter === 'month' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('month')}
          </button>
          <button
            onClick={() => setTimeFilter('year')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              timeFilter === 'year' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t('year')}
          </button>
        </div>
      </div>

      {/* Main KPI Grid (11 Required Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA du jour */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('todayRevenue')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {todayRevenue.toLocaleString()} <span className="text-xs font-semibold">{companySettings.currencySymbol}</span>
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+14.2%</span>
          </div>
        </div>

        {/* CA du Mois */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('monthRevenue')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {monthRevenue.toLocaleString()} <span className="text-xs font-semibold">{companySettings.currencySymbol}</span>
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+22.5%</span>
          </div>
        </div>

        {/* Total Créances Clients (CLIENTS ENDETTÉS FOCUS) */}
        <div
          onClick={() => setActiveTab('debtors')}
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 shadow-2xs cursor-pointer hover:border-rose-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
              {t('totalReceivables')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center animate-pulse">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-900 dark:text-rose-200 mt-2">
            {totalReceivables.toLocaleString()} <span className="text-xs font-semibold">{companySettings.currencySymbol}</span>
          </p>
          <div className="flex items-center justify-between mt-2 text-[11px] text-rose-700 dark:text-rose-400 font-bold">
            <span>{debtors.length} {t('debtors')}</span>
            <span className="underline flex items-center gap-0.5"><ArrowRight className="w-3 h-3" /></span>
          </div>
        </div>

        {/* Dettes Fournisseurs */}
        <div
          onClick={() => setActiveTab('suppliers')}
          className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer hover:border-indigo-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('totalSupplierDebts')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-2">
            {totalSupplierDebts.toLocaleString()} <span className="text-xs font-semibold">{companySettings.currencySymbol}</span>
          </p>
          <div className="text-[11px] text-slate-500 mt-2">
            À régler aux fournisseurs
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setActiveTab('products')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Package className="w-3.5 h-3.5 text-indigo-500" />
            <span>Produits</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalProducts}</p>
        </div>

        <div
          onClick={() => setActiveTab('products')}
          className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
        >
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Rupture Stock</span>
          </div>
          <p className="text-lg font-black text-rose-700 dark:text-rose-400 mt-1">{outOfStockCount}</p>
        </div>

        <div
          onClick={() => setActiveTab('inventory')}
          className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 cursor-pointer"
        >
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Faible</span>
          </div>
          <p className="text-lg font-black text-amber-700 dark:text-amber-400 mt-1">{lowStockCount}</p>
        </div>

        <div
          onClick={() => setActiveTab('customers')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Clients</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalCustomers}</p>
        </div>

        <div
          onClick={() => setActiveTab('invoices')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
            <span>Factures Total</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{totalInvoices}</p>
        </div>

        <div
          onClick={() => setActiveTab('invoices')}
          className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <CreditCard className="w-3.5 h-3.5 text-rose-500" />
            <span>Fact. Impayées</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{unpaidInvoicesCount}</p>
        </div>
      </div>

      {/* Interactive Charts Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart: Ventes vs Achats vs Bénéfices */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Évolution des Ventes, Achats & Bénéfices
              </h3>
              <p className="text-xs text-slate-500">
                Comparatif périodique exprimé en FCFA
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              Interactive
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeFilter === 'day' ? dailyData : monthlyData}>
                <defs>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip
                  formatter={(value: any) => [`${Number(value).toLocaleString()} CFA`, '']}
                  contentStyle={{ backgroundColor: '#1E293B', borderRadius: '12px', border: 'none', color: '#fff' }}
                />
                <Area type="monotone" dataKey="ventes" name="Ventes" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVentes)" />
                <Area type="monotone" dataKey="benefice" name="Bénéfice Net" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorBenefice)" />
                <Line type="monotone" dataKey="achats" name="Achats" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share Distribution */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Répartition par Catégorie
            </h3>
            <p className="text-xs text-slate-500">
              Part dans le chiffre d'affaires
            </p>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => [`${val}%`, 'Part']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700">
            {categoryDistribution.map(cat => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products & Top Customers Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Produits les Plus Vendus
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {topSellingProducts.map((p, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{p.name}</p>
                    <p className="text-[10px] text-slate-500">Quantité vendue: {p.qty} unités</p>
                  </div>
                </div>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {p.total.toLocaleString()} {companySettings.currencySymbol}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Meilleurs Clients
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('customers')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Voir tout
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {topClients.map((c, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.invoiceCount} commande(s) effectuée(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {c.total.toLocaleString()} {companySettings.currencySymbol}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Payé: {c.paid.toLocaleString()} CFA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
