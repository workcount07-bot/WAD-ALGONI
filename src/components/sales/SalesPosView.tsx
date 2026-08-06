import React, { useState } from 'react';
import {
  ShoppingCart,
  Store,
  Building2,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Percent,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useERP } from '../../context/ERPContext';
import { Product, SaleType, PaymentMethod, InvoiceItem } from '../../types/erp';

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  priceType: 'retail' | 'wholesale';
  discount: number;
}

export const SalesPosView: React.FC = () => {
  const {
    products,
    categories,
    customers,
    createInvoice,
    setActiveTab,
    companySettings,
    currentUser,
    t
  } = useERP();

  // Mode: Retail vs Wholesale
  const [saleType, setSaleType] = useState<SaleType>('retail');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-particulier');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);

  // Guarantee PARTICULIER customer option is available
  const particulierCustomer = customers.find(c => c.id === 'cust-particulier') || {
    id: 'cust-particulier',
    name: 'PARTICULIER (Client non enregistré)',
    phone: 'Comptoir',
    email: 'particulier@client.local',
    address: 'Vente directe au comptoir',
    neighborhood: 'Magasin',
    city: 'Dakar',
    country: 'Sénégal',
    createdAt: '2026-01-01',
  };

  const allCustomerOptions = customers.some(c => c.id === 'cust-particulier')
    ? customers
    : [particulierCustomer, ...customers];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [saleSuccessInvoice, setSaleSuccessInvoice] = useState<any | null>(null);

  // Price getter based on sale type
  const getProductPrice = (p: Product, priceType: 'retail' | 'wholesale' = saleType) => {
    return priceType === 'wholesale' ? p.wholesalePrice : p.retailPrice;
  };

  // Add product to cart with specific option (retail or wholesale)
  const handleAddToCart = (product: Product, priceType: 'retail' | 'wholesale' = saleType) => {
    if (product.currentStock <= 0) {
      alert(`Stock épuisé pour ${product.name} !`);
      return;
    }

    const itemId = `${product.id}-${priceType}`;
    const price = priceType === 'wholesale' ? product.wholesalePrice : product.retailPrice;

    setCart(prev => {
      const totalQtyInCart = prev
        .filter(item => item.product.id === product.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (totalQtyInCart >= product.currentStock) {
        alert(`Stock insuffisant (${product.currentStock} ${product.unit} disponibles en tout).`);
        return prev;
      }

      const existing = prev.find(item => item.id === itemId);
      if (existing) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: itemId,
            product,
            quantity: 1,
            unitPrice: price,
            priceType,
            discount: 0,
          }
        ];
      }
    });
  };

  // Adjust cart item quantity
  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart(prev => {
      const target = prev.find(i => i.id === itemId);
      if (!target) return prev;

      const totalQtyForProduct = prev
        .filter(i => i.product.id === target.product.id)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (delta > 0 && totalQtyForProduct + delta > target.product.currentStock) {
        alert(`Stock maximum disponible : ${target.product.currentStock} ${target.product.unit}`);
        return prev;
      }

      return prev
        .map(item => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Toggle cart item pricing mode (Détail vs Gros)
  const handleToggleCartItemPriceType = (itemId: string) => {
    setCart(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const newType: 'retail' | 'wholesale' = item.priceType === 'retail' ? 'wholesale' : 'retail';
          const newPrice = newType === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice;
          const newId = `${item.product.id}-${newType}`;
          return {
            ...item,
            id: newId,
            priceType: newType,
            unitPrice: newPrice,
          };
        }
        return item;
      })
    );
  };

  // Handle Barcode enter
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const isUserAdmin = currentUser?.role === 'admin';
    const assignedIds = currentUser?.assignedProductIds || [];

    const found = products.find(p => p.barcode === barcodeInput || p.code === barcodeInput);
    if (found) {
      if (!isUserAdmin && !assignedIds.includes(found.id)) {
        alert(`Le produit "${found.name}" ne vous a pas été assigné par l'administrateur.`);
        return;
      }
      handleAddToCart(found, saleType);
      setBarcodeInput('');
    } else {
      alert(`Aucun produit trouvé avec le code: ${barcodeInput}`);
    }
  };

  // Switch global sale type mode
  const handleSaleTypeChange = (type: SaleType) => {
    setSaleType(type);
    setCart(prev =>
      prev.map(item => {
        const newPrice = type === 'wholesale' ? item.product.wholesalePrice : item.product.retailPrice;
        return {
          ...item,
          id: `${item.product.id}-${type}`,
          priceType: type,
          unitPrice: newPrice,
        };
      })
    );
  };

  // Cart Total Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const cartVat = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.product.vatRate) / 100, 0);
  const cartTotalBeforeDiscount = cartSubtotal + cartVat;
  const grandTotal = Math.max(0, cartTotalBeforeDiscount - globalDiscount);

  const actualPaidAmount = amountPaidInput === '' ? grandTotal : Number(amountPaidInput);
  const remainingDebt = Math.max(0, grandTotal - actualPaidAmount);

  // Complete Sale & Generate Invoice
  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Votre panier de vente est vide.');
      return;
    }

    const customer = allCustomerOptions.find(c => c.id === selectedCustomerId) || allCustomerOptions[0];

    const invoiceItems: InvoiceItem[] = cart.map((item, idx) => {
      const sub = item.quantity * item.unitPrice;
      const vat = (sub * item.product.vatRate) / 100;
      return {
        id: `inv-item-${idx}-${Date.now()}`,
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        unit: item.product.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        vatRate: item.product.vatRate,
        discount: item.discount,
        subtotal: sub,
        total: sub + vat - item.discount,
      };
    });

    const newInv = createInvoice({
      date: new Date().toISOString().split('T')[0],
      dueDate: remainingDebt > 0 ? new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      saleType: saleType,
      items: invoiceItems,
      subtotal: cartSubtotal,
      vatAmount: cartVat,
      discountAmount: globalDiscount,
      totalAmount: grandTotal,
      paidAmount: actualPaidAmount,
      remainingAmount: remainingDebt,
      status: remainingDebt === 0 ? 'paid' : actualPaidAmount > 0 ? 'partial' : 'unpaid',
      paymentMethod: paymentMethod,
      notes: notes || `Vente POS en ${saleType === 'wholesale' ? 'GROS' : 'DÉTAIL'} - ${currentUser?.storeName || 'Boutique Principale'}`,
      createdBy: currentUser?.name || 'Caissier',
      userId: currentUser?.id,
      storeName: currentUser?.storeName || 'Boutique Principale',
    });

    setSaleSuccessInvoice(newInv);
    setCart([]);
    setAmountPaidInput('');
    setNotes('');
  };

  // Filter Products by Search, Category, Assigned User Products & Store
  const userStore = currentUser?.storeName || 'Boutique Principale';
  const isUserAdmin = currentUser?.role === 'admin';
  const assignedIds = currentUser?.assignedProductIds || [];

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search);

    const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;

    // Strict assigned products filter for non-admins
    const matchesUser = isUserAdmin ? true : assignedIds.includes(p.id);

    return matchesSearch && matchesCat && matchesUser;
  });

  return (
    <div className="space-y-4">
      {/* Top POS Switcher: Retail vs Wholesale Mode & Store Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Caisse & Terminal Vente (POS)
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{userStore}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Ventes de la boutique ({currentUser?.name || 'Caissier'})
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleSaleTypeChange('retail')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              saleType === 'retail'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Vente au Détail</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaleTypeChange('wholesale')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              saleType === 'wholesale'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Vente en Gros</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Catalog (Left) + Cart & Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Product Selector */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Chercher produit par nom..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>

            <form onSubmit={handleBarcodeSubmit} className="relative">
              <Barcode className="w-4 h-4 text-indigo-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scanner code-barres..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
              />
            </form>
          </div>

          {/* Category Quick Tabs */}
          {!isUserAdmin && (
            <div className="p-2.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between gap-2">
              <span className="font-semibold">
                🔒 Catalogue restreint : {assignedIds.length} produit(s) vous ont été attribué(s) par l'administrateur.
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Toutes ({filteredProducts.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[580px] overflow-y-auto custom-scrollbar p-1">
            {filteredProducts.map(p => {
              const isOut = p.currentStock === 0;

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col justify-between transition-all ${
                    isOut
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="relative mb-2">
                      {p.photo ? (
                        <img
                          src={p.photo}
                          alt={p.name}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-full h-24 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 font-bold flex items-center justify-center text-xs">
                          {p.code}
                        </div>
                      )}
                      <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md shadow-2xs ${
                        isOut
                          ? 'bg-rose-500 text-white'
                          : p.currentStock <= p.minStock
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-900/80 text-white'
                      }`}>
                        {isOut ? 'Épuisé' : `${p.currentStock} ${p.unit}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Ref: {p.code}
                    </p>
                  </div>

                  {/* Options: DÉTAIL & EN GROS */}
                  <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>Tarif au choix :</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Option DÉTAIL */}
                      <button
                        type="button"
                        disabled={isOut}
                        onClick={() => handleAddToCart(p, 'retail')}
                        className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isOut
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-600 text-emerald-800 dark:text-emerald-300 hover:text-white border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-600 shadow-2xs active:scale-95 cursor-pointer'
                        }`}
                        title="Cliquer pour ajouter au tarif DÉTAIL"
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider">DÉTAIL</span>
                        <span className="text-[11px] font-bold">{p.retailPrice.toLocaleString()} CFA</span>
                      </button>

                      {/* Option EN GROS */}
                      <button
                        type="button"
                        disabled={isOut}
                        onClick={() => handleAddToCart(p, 'wholesale')}
                        className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                          isOut
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            : 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-600 text-indigo-800 dark:text-indigo-300 hover:text-white border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-600 shadow-2xs active:scale-95 cursor-pointer'
                        }`}
                        title="Cliquer pour ajouter au tarif EN GROS"
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider">EN GROS</span>
                        <span className="text-[11px] font-bold">{p.wholesalePrice.toLocaleString()} CFA</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Checkout Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Panier de Vente</h3>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${saleType === 'wholesale' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                Mode par défaut : {saleType === 'wholesale' ? 'Gros' : 'Détail'}
              </span>
            </div>

            {/* Select Customer */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  {t('selectCustomer')}
                </label>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId('cust-particulier')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    selectedCustomerId === 'cust-particulier'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{t('walkInCustomer')}</span>
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl outline-none font-semibold transition-all border shadow-xs cursor-pointer ${
                  selectedCustomerId === 'cust-particulier'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                }`}
              >
                {allCustomerOptions.map(c => (
                  <option
                    key={c.id}
                    value={c.id}
                    className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium py-1.5 px-2"
                  >
                    {c.name} {c.phone && c.phone !== 'Comptoir' ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-700/60">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  {t('cartEmptyMsg')}
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {item.product.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleToggleCartItemPriceType(item.id)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${
                            item.priceType === 'wholesale'
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                          title="Cliquer pour basculer entre DÉTAIL et EN GROS"
                        >
                          {item.priceType === 'wholesale' ? t('modeWholesale') : t('modeRetail')}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {item.unitPrice.toLocaleString()} {companySettings.currencySymbol} x {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                        </button>
                        <span className="font-bold text-xs px-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                        </button>
                      </div>

                      <span className="font-bold text-slate-900 dark:text-white min-w-[70px] text-right">
                        {(item.quantity * item.unitPrice).toLocaleString()} {companySettings.currencySymbol}
                      </span>

                      <button
                        onClick={() => handleUpdateQty(item.id, -item.quantity)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals & Payment Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>{t('subtotal')} :</span>
                <span>{cartSubtotal.toLocaleString()} {companySettings.currencySymbol}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>{t('vat')} :</span>
                <span>{cartVat.toLocaleString()} {companySettings.currencySymbol}</span>
              </div>
              {globalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{t('discount')} :</span>
                  <span>-{globalDiscount.toLocaleString()} {companySettings.currencySymbol}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-700">
                <span>{t('totalToPay')} :</span>
                <span className="text-emerald-600 dark:text-emerald-400">{grandTotal.toLocaleString()} {companySettings.currencySymbol}</span>
              </div>
            </div>

            {/* Payment Method & Amount Paid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  {t('paymentType')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-900 dark:text-white font-semibold cursor-pointer"
                >
                  <option value="cash" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('cash')}</option>
                  <option value="card" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('card')}</option>
                  <option value="transfer" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('transfer')}</option>
                  <option value="check" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('check')}</option>
                  <option value="mobile_money" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{t('mobileMoney')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">
                  {t('amountReceived')}
                </label>
                <input
                  type="number"
                  placeholder={`${grandTotal} ${companySettings.currencySymbol}`}
                  value={amountPaidInput}
                  onChange={e => setAmountPaidInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Customer Remaining Balance / Debt Indicator */}
            {remainingDebt > 0 && (
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-400 text-xs flex justify-between font-bold">
                <span>{t('remainingDebt')} :</span>
                <span>{remainingDebt.toLocaleString()} {companySettings.currencySymbol}</span>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className={`w-full py-3 text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                cart.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
              id="btn-complete-sale"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider la Vente & Imprimer Facture</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Invoice Modal */}
      {saleSuccessInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Vente Enregistrée avec Succès !
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La facture <span className="font-mono font-bold text-indigo-600">{saleSuccessInvoice.invoiceNumber}</span> a été générée et le stock a été mis à jour.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Client :</span>
                <span className="font-bold">{saleSuccessInvoice.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant Total :</span>
                <span className="font-bold text-slate-900 dark:text-white">{saleSuccessInvoice.totalAmount.toLocaleString()} CFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Montant Payé :</span>
                <span className="font-bold text-emerald-600">{saleSuccessInvoice.paidAmount.toLocaleString()} CFA</span>
              </div>
              {saleSuccessInvoice.remainingAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Reste à Payer :</span>
                  <span>{saleSuccessInvoice.remainingAmount.toLocaleString()} CFA</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSaleSuccessInvoice(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl border border-slate-200"
              >
                Nouvelle Vente
              </button>
              <button
                onClick={() => {
                  setSaleSuccessInvoice(null);
                  setActiveTab('invoices');
                }}
                className="flex-1 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-1"
              >
                <span>Voir Factures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
