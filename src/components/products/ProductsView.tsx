import React, { useState, useRef, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Barcode,
  History,
  FileSpreadsheet,
  Upload,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Sparkles,
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Store,
  ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useERP } from '../../context/ERPContext';
import { Product } from '../../types/erp';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    stockMovements,
    companySettings,
    currentUser,
    stores,
    t
  } = useERP();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [scanBarcodeOpen, setScanBarcodeOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    categoryId: categories[0]?.id || '',
    brand: '',
    unit: 'pièce',
    photo: '',
    description: '',
    buyPrice: 0,
    wholesalePrice: 0,
    retailPrice: 0,
    vatRate: companySettings.defaultVatRate,
    currentStock: 0,
    minStock: 5,
    location: 'Dépôt Principal',
    storeName: 'Toutes les boutiques'
  });

  // Photo Capture & Local File Upload State & Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Barcode Scanner Simulator State
  const [scannedCode, setScannedCode] = useState('');

  // Handle local file picking
  const handleBrowseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop volumineuse (maximum 5 Mo). Veuillez choisir un fichier plus petit.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, photo: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input so user can choose the same file again if desired
    e.target.value = '';
  };

  // Camera Management
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setMediaStream(stream);
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Erreur accès caméra:", err);
      setCameraError("Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.");
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, photo: dataUrl }));
        stopCamera();
      }
    }
  };

  // Bind video element to camera stream when active
  useEffect(() => {
    if (isCameraActive && mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isCameraActive, mediaStream]);

  // Clean up camera on modal close
  useEffect(() => {
    if (!isAddModalOpen) {
      stopCamera();
    }
  }, [isAddModalOpen]);

  // Open add modal initialized
  const handleOpenAdd = () => {
    if (currentUser?.role !== 'admin') {
      alert("Seul l'administrateur est autorisé à ajouter ou modifier les produits.");
      return;
    }
    const codeNum = products.length + 1;
    setFormData({
      code: `PRD-${String(codeNum).padStart(3, '0')}`,
      barcode: `6111234567${String(codeNum).padStart(3, '0')}`,
      name: '',
      categoryId: categories[0]?.id || '',
      brand: '',
      unit: 'pièce',
      photo: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&auto=format&fit=crop&q=80',
      description: '',
      buyPrice: 1000,
      wholesalePrice: 1200,
      retailPrice: 1500,
      vatRate: companySettings.defaultVatRate,
      currentStock: 20,
      minStock: 5,
      location: 'Rayon A-01',
      storeName: 'Toutes les boutiques'
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    if (currentUser?.role !== 'admin') {
      alert("Seul l'administrateur est autorisé à modifier les produits.");
      return;
    }
    setEditingProduct(p);
    setFormData({
      code: p.code,
      barcode: p.barcode,
      name: p.name,
      categoryId: p.categoryId,
      brand: p.brand,
      unit: p.unit,
      photo: p.photo || '',
      description: p.description || '',
      buyPrice: p.buyPrice,
      wholesalePrice: p.wholesalePrice,
      retailPrice: p.retailPrice,
      vatRate: p.vatRate,
      currentStock: p.currentStock,
      minStock: p.minStock,
      location: p.location,
      storeName: p.storeName || 'Toutes les boutiques'
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, formData);
    } else {
      addProduct(formData);
    }
    setIsAddModalOpen(false);
  };

  // Barcode Scanner Quick Lookup Simulation
  const handleSimulateBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedCode) return;

    const found = products.find(p => p.barcode === scannedCode || p.code === scannedCode);
    if (found) {
      setSearch(found.barcode);
    } else {
      alert(`Aucun produit trouvé avec le code-barres "${scannedCode}".`);
    }
    setScanBarcodeOpen(false);
    setScannedCode('');
  };

  // Excel Export
  const handleExportExcel = () => {
    const data = products.map(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      return {
        Code: p.code,
        'Code-barres': p.barcode,
        Nom: p.name,
        Catégorie: cat ? cat.name : '',
        Marque: p.brand,
        Unité: p.unit,
        'Prix Achat (CFA)': p.buyPrice,
        'Prix Gros (CFA)': p.wholesalePrice,
        'Prix Détail (CFA)': p.retailPrice,
        'TVA (%)': p.vatRate,
        'Stock Actuel': p.currentStock,
        'Stock Min': p.minStock,
        Emplacement: p.location,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Catalogue Produits');
    XLSX.writeFile(wb, `Stock_Produits_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtered List
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;

    let matchesStock = true;
    if (stockStatusFilter === 'out') matchesStock = p.currentStock === 0;
    else if (stockStatusFilter === 'low') matchesStock = p.currentStock > 0 && p.currentStock <= p.minStock;
    else if (stockStatusFilter === 'normal') matchesStock = p.currentStock > p.minStock;

    // Assigned products filter for non-admins
    let matchesUser = true;
    if (currentUser?.role !== 'admin') {
      const assigned = currentUser?.assignedProductIds || [];
      matchesUser = assigned.includes(p.id);
    }

    return matchesSearch && matchesCategory && matchesStock && matchesUser;
  });

  return (
    <div className="space-y-6">
      {/* Non-Admin Info Banner */}
      {currentUser?.role !== 'admin' && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Mode Consultation :</strong> Seul l'administrateur est autorisé à ajouter, modifier ou supprimer des produits. Vous pouvez consulter les stocks et effectuer des encaissements dans votre caisse.
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('productsTitle')}
            </h2>
            <p className="text-xs text-slate-500">
              Contrôlez les prix gros & détail, stocks minimums et affectations boutiques.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setScanBarcodeOpen(true)}
            className="px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            id="btn-scan-barcode"
          >
            <Barcode className="w-4 h-4 text-indigo-500" />
            <span>{t('barcodeScanner')}</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{t('excelExport')}</span>
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-add-product"
            >
              <Plus className="w-4 h-4" />
              <span>{t('newProduct')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, code, code-barres..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl">
          <button
            onClick={() => setStockStatusFilter('all')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              stockStatusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setStockStatusFilter('low')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              stockStatusFilter === 'low'
                ? 'bg-amber-500 text-white'
                : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            Faible
          </button>
          <button
            onClick={() => setStockStatusFilter('out')}
            className={`flex-1 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
              stockStatusFilter === 'out'
                ? 'bg-rose-600 text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            Rupture
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Article & Code</th>
                <th className="py-3.5 px-4">Boutique</th>
                <th className="py-3.5 px-4">Catégorie</th>
                <th className="py-3.5 px-4 text-right">Prix Achat</th>
                <th className="py-3.5 px-4 text-right">Prix Gros</th>
                <th className="py-3.5 px-4 text-right">Prix Détail</th>
                <th className="py-3.5 px-4 text-center">Stock Actuel</th>
                <th className="py-3.5 px-4">Emplacement</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucun produit ne correspond à la recherche.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const category = categories.find(c => c.id === p.categoryId);
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                  const isOut = p.currentStock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-750/50 transition-colors">
                      {/* Product Name & Photo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {p.photo ? (
                            <img
                              src={p.photo}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {p.code}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Ref: <span className="font-mono font-medium">{p.code}</span> | BC: {p.barcode}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Store Badge */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 inline-flex items-center gap-1">
                          <Store className="w-3 h-3 text-purple-500" />
                          <span>{p.storeName || 'Toutes les boutiques'}</span>
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                          {category ? category.name : 'Sans catégorie'}
                        </span>
                      </td>

                      {/* Buy Price */}
                      <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                        {p.buyPrice.toLocaleString()} CFA
                      </td>

                      {/* Wholesale Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {p.wholesalePrice.toLocaleString()} CFA
                      </td>

                      {/* Retail Price */}
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {p.retailPrice.toLocaleString()} CFA
                      </td>

                      {/* Current Stock */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-0.5 font-bold rounded-full text-xs ${
                              isOut
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                                : isLow
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            }`}
                          >
                            {p.currentStock} {p.unit}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">
                            Min: {p.minStock}
                          </span>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {p.location}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setHistoryProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                            title="Historique mouvements"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(p)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in my-8">
            <div className="flex items-center justify-between p-4 bg-indigo-600 text-white">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Code Produit
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Code-barres (EAN13/128)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nom du Produit
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    placeholder="ex: Riz Parfumé 25kg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Marque
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={e => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    placeholder="ex: Samsung, Lesieur, Sococim"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Unité de Vente
                  </label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="pièce">Pièce</option>
                    <option value="sac">Sac</option>
                    <option value="carton">Carton</option>
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="litre">Litre (L)</option>
                    <option value="feuille">Feuille / Tôle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prix d'Achat (CFA)
                  </label>
                  <input
                    type="number"
                    value={formData.buyPrice}
                    onChange={e => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                    Prix Vente GROS (CFA)
                  </label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={e => setFormData({ ...formData, wholesalePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 dark:text-indigo-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    Prix Vente DÉTAIL (CFA)
                  </label>
                  <input
                    type="number"
                    value={formData.retailPrice}
                    onChange={e => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 dark:text-emerald-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Initial / Actuel
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Stock Minimum (Alerte)
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Emplacement / Rayon
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    placeholder="ex: Rayon A-04, Dépôt B"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Affectation Boutique / Magasin</span>
                  </label>
                  <select
                    value={formData.storeName}
                    onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-purple-50/40 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 text-purple-900 dark:text-purple-200 font-semibold"
                  >
                    <option value="Toutes les boutiques">🌐 Toutes les boutiques (Disponible dans toutes les caisses)</option>
                    {stores.map((st, idx) => (
                      <option key={idx} value={st}>
                        🏪 {st}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    L'administrateur attribue ce produit à une boutique spécifique ou à l'ensemble du réseau.
                  </p>
                </div>

                <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Photo du Produit (Caméra & Fichier local)
                  </label>

                  {/* Input fichier masqué pour navigation locale */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Mode Caméra En Direct */}
                  {isCameraActive ? (
                    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 p-3 space-y-3 shadow-xl">
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold animate-pulse">
                          ● {t('liveCamera')}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>{t('cancel')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{t('takePhoto')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                      <div className="flex items-center gap-4">
                        {/* Aperçu Photo Actuelle */}
                        {formData.photo ? (
                          <div className="relative group shrink-0">
                            <img
                              src={formData.photo}
                              alt="Aperçu produit"
                              className="w-20 h-20 object-cover rounded-2xl border-2 border-indigo-500/30 shadow-xs bg-white dark:bg-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, photo: '' })}
                              className="absolute -top-2 -right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-transform hover:scale-110 cursor-pointer"
                              title="Supprimer la photo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-slate-200/60 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon className="w-6 h-6 mb-1 opacity-60 text-slate-500" />
                            <span className="text-[9px] font-bold">{t('noPhoto')}</span>
                          </div>
                        )}

                        {/* Boutons d'Action Caméra & Navigation Locale */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                              <Camera className="w-4 h-4" />
                              <span>{t('launchCamera')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleBrowseFile}
                              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                            >
                              <FolderOpen className="w-4 h-4 text-amber-500" />
                              <span>{t('browseLocal')}</span>
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-400">
                            Prenez directement une photo via votre webcam/appareil ou sélectionnez un fichier image (JPG, PNG, WebP) sur votre appareil.
                          </p>
                        </div>
                      </div>

                      {cameraError && (
                        <div className="p-2.5 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-xl flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{cameraError}</span>
                        </div>
                      )}

                      {/* Champ URL fallback */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1">
                          Ou coller une adresse d'image externe (URL) :
                        </label>
                        <input
                          type="url"
                          value={formData.photo}
                          onChange={e => setFormData({ ...formData, photo: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  {editingProduct ? 'Enregistrer les modifications' : 'Créer le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal Simulator */}
      {scanBarcodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Scanner / Saisir Code-barres</h3>
              </div>
              <button onClick={() => setScanBarcodeOpen(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSimulateBarcodeScan} className="p-5 space-y-4">
              <div className="p-4 bg-slate-900 rounded-xl text-center border border-slate-700 relative overflow-hidden">
                <div className="w-full h-1 bg-rose-500 absolute top-1/2 left-0 animate-pulse shadow-lg shadow-rose-500" />
                <Camera className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
                <p className="text-xs text-slate-300 font-medium">
                  Laser douchette prêt...
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Passez l'article devant le lecteur ou tapez le code manuellement :
                </p>
              </div>

              <div>
                <input
                  type="text"
                  value={scannedCode}
                  onChange={e => setScannedCode(e.target.value)}
                  placeholder="ex: 6111234567012"
                  className="w-full px-3 py-2 text-sm font-mono text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setScanBarcodeOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md"
                >
                  Rechercher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement History Modal per Product */}
      {historyProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div>
                <h3 className="font-bold text-sm">Historique du Stock - {historyProduct.name}</h3>
                <p className="text-[10px] text-slate-400">Code: {historyProduct.code} | Stock: {historyProduct.currentStock} {historyProduct.unit}</p>
              </div>
              <button onClick={() => setHistoryProduct(null)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Type</th>
                    <th className="p-2 text-center">Qté</th>
                    <th className="p-2 text-center">Stock</th>
                    <th className="p-2">Motif / Réf</th>
                    <th className="p-2">Auteur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {stockMovements
                    .filter(m => m.productId === historyProduct.id)
                    .map(m => (
                      <tr key={m.id}>
                        <td className="p-2 text-[11px] font-mono text-slate-500">{m.date}</td>
                        <td className="p-2 font-bold">
                          {m.type === 'in' ? (
                            <span className="text-emerald-600">Entrée</span>
                          ) : m.type === 'out' ? (
                            <span className="text-rose-600">Sortie</span>
                          ) : (
                            <span className="text-amber-600">Ajustement</span>
                          )}
                        </td>
                        <td className="p-2 text-center font-bold">{m.quantity}</td>
                        <td className="p-2 text-center">{m.previousStock} → {m.newStock}</td>
                        <td className="p-2 text-[11px] text-slate-600 dark:text-slate-300">{m.reason}</td>
                        <td className="p-2 text-[10px] text-slate-400">{m.performedBy}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Supprimer le produit ?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Êtes-vous sûr de vouloir supprimer définitivement <strong className="text-slate-800 dark:text-slate-200">"{productToDelete.name}"</strong> (Réf: {productToDelete.code}) ?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-colors"
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
