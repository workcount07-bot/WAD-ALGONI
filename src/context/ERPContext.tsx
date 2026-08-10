import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToDoc, updateDocValue } from '../firebase';
import {
  Product,
  Category,
  Supplier,
  Customer,
  DebtorCustomer,
  Invoice,
  PurchaseOrder,
  PaymentRecord,
  StockMovement,
  SystemNotification,
  CompanySettings,
  User,
  UserRole,
  Language,
  Theme,
  RiskLevel
} from '../types/erp';
import {
  initialCompanySettings,
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialCustomers,
  initialInvoices,
  initialPurchases,
  initialPayments,
  initialStockMovements,
  initialNotifications,
  initialUsers,
  initialStores
} from '../data/mockData';
import { translations } from '../i18n/translations';

interface ERPContextType {
  // State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;

  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;

  categories: Category[];
  addCategory: (cat: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, cat: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'balance'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  debtors: DebtorCustomer[];

  invoices: Invoice[];
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;

  purchases: PurchaseOrder[];
  createPurchaseOrder: (purchaseData: Omit<PurchaseOrder, 'id' | 'orderNumber'>) => PurchaseOrder;

  payments: PaymentRecord[];
  addPayment: (paymentData: Omit<PaymentRecord, 'id'>) => PaymentRecord;

  stockMovements: StockMovement[];
  addStockMovement: (mov: Omit<StockMovement, 'id'>) => void;

  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  stores: string[];
  addStore: (name: string) => void;

  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  
  // Helpers
  resetDemoData: () => void;
  t: (key: string) => string;
}

const STORAGE_PREFIX = 'odoo_erp_store_v1_';

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    console.error('Failed to parse storage key:', key, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save storage key:', key, e);
  }
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const loaded = loadFromStorage('settings', initialCompanySettings);
    if (!loaded.name || loaded.name.includes('Odoo') || loaded.name.includes('OdooERP')) {
      return {
        ...loaded,
        name: 'WAD-ALGONI Commercial & Distrib',
        email: loaded.email && loaded.email.includes('odoo') ? 'contact@wad-algoni.com' : (loaded.email || 'contact@wad-algoni.com')
      };
    }
    return loaded;
  });

  const [language, setLanguageState] = useState<Language>(companySettings.language);
  const [theme, setThemeState] = useState<Theme>(companySettings.theme);
  
  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadFromStorage('users', initialUsers);
    if (!Array.isArray(loaded) || loaded.length === 0) return initialUsers;
    return loaded.map((u: User, idx: number) => {
      if (u.role === 'admin' || u.id === 'usr-1') {
        return {
          ...u,
          username: 'algoni',
          password: '6326',
          storeName: u.storeName || 'Boutique Principale'
        };
      }
      const matchInit = initialUsers.find(iu => iu.id === u.id || iu.email === u.email);
      return {
        ...u,
        username: u.username || matchInit?.username || u.name.toLowerCase().replace(/\s+/g, ''),
        password: u.password || matchInit?.password || '123456',
        storeName: u.storeName || matchInit?.storeName || 'Boutique Principale',
        assignedProductIds: u.assignedProductIds !== undefined ? u.assignedProductIds : (matchInit?.assignedProductIds || [])
      };
    });
  });
  const [currentUser, setCurrentUser] = useState<User>(users[0] || initialUsers[0]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() =>
    loadFromStorage('isAuthenticated', false)
  );

  const [stores, setStores] = useState<string[]>(() =>
    loadFromStorage('stores', initialStores)
  );

  useEffect(() => {
    saveToStorage('stores', stores);
  }, [stores]);

  const addStore = (storeName: string) => {
    const trimmed = storeName.trim();
    if (!trimmed) return;
    if (!stores.includes(trimmed)) {
      setStores(prev => {
        const next = [...prev, trimmed];
        updateDocValue('stores', next);
        return next;
      });
    }
  };

  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);

  const [categories, setCategories] = useState<Category[]>(() =>
    loadFromStorage('categories', initialCategories)
  );
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage('products', initialProducts)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage('suppliers', initialSuppliers)
  );
  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage('customers', initialCustomers)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadFromStorage('invoices', initialInvoices)
  );
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() =>
    loadFromStorage('purchases', initialPurchases)
  );
  const [payments, setPayments] = useState<PaymentRecord[]>(() =>
    loadFromStorage('payments', initialPayments)
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadFromStorage('stockMovements', initialStockMovements)
  );
  const [notifications, setNotifications] = useState<SystemNotification[]>(() =>
    loadFromStorage('notifications', initialNotifications)
  );

  // Sync effect with localStorage
  useEffect(() => { saveToStorage('settings', companySettings); }, [companySettings]);
  useEffect(() => { saveToStorage('categories', categories); }, [categories]);
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveToStorage('customers', customers); }, [customers]);
  useEffect(() => { saveToStorage('invoices', invoices); }, [invoices]);
  useEffect(() => { saveToStorage('purchases', purchases); }, [purchases]);
  useEffect(() => { saveToStorage('payments', payments); }, [payments]);
  useEffect(() => { saveToStorage('stockMovements', stockMovements); }, [stockMovements]);
  useEffect(() => { saveToStorage('notifications', notifications); }, [notifications]);
  useEffect(() => { saveToStorage('users', users); }, [users]);

  // Real-time synchronization across all devices via Firebase Firestore
  useEffect(() => {
    const unsubSettings = subscribeToDoc<CompanySettings>('settings', (val) => setCompanySettings(val), companySettings);
    const unsubCategories = subscribeToDoc<Category[]>('categories', (val) => setCategories(val), loadFromStorage('categories', initialCategories));
    const unsubProducts = subscribeToDoc<Product[]>('products', (val) => setProducts(val), loadFromStorage('products', initialProducts));
    const unsubSuppliers = subscribeToDoc<Supplier[]>('suppliers', (val) => setSuppliers(val), loadFromStorage('suppliers', initialSuppliers));
    const unsubCustomers = subscribeToDoc<Customer[]>('customers', (val) => setCustomers(val), loadFromStorage('customers', initialCustomers));
    const unsubInvoices = subscribeToDoc<Invoice[]>('invoices', (val) => setInvoices(val), loadFromStorage('invoices', initialInvoices));
    const unsubPurchases = subscribeToDoc<PurchaseOrder[]>('purchases', (val) => setPurchases(val), loadFromStorage('purchases', initialPurchases));
    const unsubPayments = subscribeToDoc<PaymentRecord[]>('payments', (val) => setPayments(val), loadFromStorage('payments', initialPayments));
    const unsubStockMovements = subscribeToDoc<StockMovement[]>('stockMovements', (val) => setStockMovements(val), loadFromStorage('stockMovements', initialStockMovements));
    const unsubNotifications = subscribeToDoc<SystemNotification[]>('notifications', (val) => setNotifications(val), loadFromStorage('notifications', initialNotifications));
    const unsubUsers = subscribeToDoc<User[]>('users', (val) => setUsers(val), loadFromStorage('users', initialUsers));
    const unsubStores = subscribeToDoc<string[]>('stores', (val) => setStores(val), loadFromStorage('stores', initialStores));

    return () => {
      unsubSettings();
      unsubCategories();
      unsubProducts();
      unsubSuppliers();
      unsubCustomers();
      unsubInvoices();
      unsubPurchases();
      unsubPayments();
      unsubStockMovements();
      unsubNotifications();
      unsubUsers();
      unsubStores();
    };
  }, []);

  // Handle RTL vs LTR attribute on <html> element
  useEffect(() => {
    const htmlEl = document.documentElement;
    if (language === 'ar') {
      htmlEl.setAttribute('dir', 'rtl');
      htmlEl.setAttribute('lang', 'ar');
    } else {
      htmlEl.setAttribute('dir', 'ltr');
      htmlEl.setAttribute('lang', language);
    }
  }, [language]);

  // Handle dark mode class on <html> element
  useEffect(() => {
    const htmlEl = document.documentElement;
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
    } else {
      htmlEl.classList.remove('dark');
    }
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setCompanySettings(prev => {
      const next = { ...prev, language: lang };
      updateDocValue('settings', next);
      return next;
    });
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    setCompanySettings(prev => {
      const next = { ...prev, theme: t };
      updateDocValue('settings', next);
      return next;
    });
  };

  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings(prev => {
      const next = { ...prev, ...newSettings };
      updateDocValue('settings', next);
      return next;
    });
  };

  // Category Actions
  const addCategory = (cat: Omit<Category, 'id'>) => {
    const newCat: Category = { ...cat, id: 'cat-' + Date.now() };
    setCategories(prev => {
      const next = [...prev, newCat];
      updateDocValue('categories', next);
      return next;
    });
  };
  const updateCategory = (id: string, cat: Partial<Category>) => {
    setCategories(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...cat } : c);
      updateDocValue('categories', next);
      return next;
    });
  };
  const deleteCategory = (id: string) => {
    setCategories(prev => {
      const next = prev.filter(c => c.id !== id);
      updateDocValue('categories', next);
      return next;
    });
  };

  // Product Actions
  const addProduct = (p: Omit<Product, 'id' | 'createdAt'>) => {
    const newProd: Product = {
      ...p,
      id: 'prod-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProducts(prev => {
      const next = [newProd, ...prev];
      updateDocValue('products', next);
      return next;
    });

    // Record initial stock entry movement
    if (p.currentStock > 0) {
      addStockMovement({
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        productId: newProd.id,
        productCode: newProd.code,
        productName: newProd.name,
        type: 'in',
        quantity: p.currentStock,
        previousStock: 0,
        newStock: p.currentStock,
        reason: 'Initialisation du produit',
        location: p.location,
        performedBy: currentUser.name,
      });
    }
  };
  const updateProduct = (id: string, p: Partial<Product>) => {
    setProducts(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...p } : item);
      updateDocValue('products', next);
      return next;
    });
  };
  const deleteProduct = (id: string) => {
    setProducts(prev => {
      const next = prev.filter(item => item.id !== id);
      updateDocValue('products', next);
      return next;
    });
  };

  // Supplier Actions
  const addSupplier = (s: Omit<Supplier, 'id' | 'createdAt' | 'balance'>) => {
    const newSup: Supplier = {
      ...s,
      id: 'sup-' + Date.now(),
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSuppliers(prev => {
      const next = [newSup, ...prev];
      updateDocValue('suppliers', next);
      return next;
    });
  };
  const updateSupplier = (id: string, s: Partial<Supplier>) => {
    setSuppliers(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...s } : item);
      updateDocValue('suppliers', next);
      return next;
    });
  };
  const deleteSupplier = (id: string) => {
    setSuppliers(prev => {
      const next = prev.filter(item => item.id !== id);
      updateDocValue('suppliers', next);
      return next;
    });
  };

  // Customer Actions
  const addCustomer = (c: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...c,
      id: 'cust-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers(prev => {
      const next = [newCust, ...prev];
      updateDocValue('customers', next);
      return next;
    });
  };
  const updateCustomer = (id: string, c: Partial<Customer>) => {
    setCustomers(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...c } : item);
      updateDocValue('customers', next);
      return next;
    });
  };
  const deleteCustomer = (id: string) => {
    setCustomers(prev => {
      const next = prev.filter(item => item.id !== id);
      updateDocValue('customers', next);
      return next;
    });
  };

  // User Actions
  const addUser = (u: Omit<User, 'id'>) => {
    const newUser: User = {
      ...u,
      id: 'usr-' + Date.now(),
      username: u.username || u.name.toLowerCase().replace(/\s+/g, ''),
      password: u.password || '123456',
      avatar: u.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`
    };
    setUsers(prev => {
      const next = [...prev, newUser];
      updateDocValue('users', next);
      return next;
    });
  };

  const updateUser = (id: string, u: Partial<User>) => {
    setUsers(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...u } : item);
      updateDocValue('users', next);
      return next;
    });
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...u }));
    }
  };

  const deleteUser = (id: string) => {
    if (currentUser.id === id) {
      alert("Impossible de supprimer l'utilisateur actuellement connecté.");
      return;
    }
    setUsers(prev => {
      const next = prev.filter(item => item.id !== id);
      updateDocValue('users', next);
      return next;
    });
  };

  // Auth Actions
  const login = (usernameInput: string, passwordInput: string): { success: boolean; message?: string } => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const cleanPassword = passwordInput.trim();

    const foundUser = users.find(u => {
      const uName = (u.name || '').toLowerCase();
      const uUsername = (u.username || u.name.toLowerCase().replace(/\s+/g, '')).toLowerCase();
      const uEmail = (u.email || '').toLowerCase();

      return cleanUsername === uUsername || cleanUsername === uName || cleanUsername === uEmail;
    });

    if (!foundUser) {
      return { success: false, message: "Nom d'utilisateur ou email introuvable. (Ex: algoni)" };
    }

    const expectedPassword = foundUser.password || (foundUser.role === 'admin' ? '6326' : '123456');

    if (expectedPassword !== cleanPassword) {
      return { success: false, message: "Mot de passe incorrect." };
    }

    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    saveToStorage('isAuthenticated', true);
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    saveToStorage('isAuthenticated', false);
  };

  // Compute Debtors dynamically (CLIENTS ENDETTÉS)
  // Filtering customers whose total remaining unpaid balance > 0, ranking by highest debt
  const computeDebtors = (): DebtorCustomer[] => {
    const todayMs = new Date('2026-08-04').getTime(); // Based on app time context

    return customers.map(cust => {
      const custInvoices = invoices.filter(i => i.customerId === cust.id);
      const totalPurchased = custInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = custInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
      const remainingBalance = custInvoices.reduce((sum, i) => sum + i.remainingAmount, 0);

      const unpaidInvoices = custInvoices.filter(i => i.remainingAmount > 0);
      const unpaidInvoiceCount = unpaidInvoices.length;

      let lastInvoiceDate = cust.createdAt;
      let earliestDueDate = '';
      let maxOverdueDays = 0;

      if (custInvoices.length > 0) {
        // Sort by date desc to get latest
        const sorted = [...custInvoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        lastInvoiceDate = sorted[0].date;
      }

      if (unpaidInvoices.length > 0) {
        // Find earliest unpaid due date to compute overdue days
        const sortedUnpaid = [...unpaidInvoices].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        earliestDueDate = sortedUnpaid[0].dueDate;
        
        const dueMs = new Date(earliestDueDate).getTime();
        const diffDays = Math.floor((todayMs - dueMs) / (1000 * 60 * 60 * 24));
        maxOverdueDays = Math.max(0, diffDays);
      }

      let riskLevel: RiskLevel = 'green';
      if (maxOverdueDays > 30) {
        riskLevel = 'red';
      } else if (maxOverdueDays >= 15) {
        riskLevel = 'orange';
      } else {
        riskLevel = 'green';
      }

      return {
        ...cust,
        lastInvoiceDate,
        unpaidInvoiceCount,
        totalPurchased,
        totalPaid,
        remainingBalance,
        overdueDays: maxOverdueDays,
        riskLevel,
      };
    })
    .filter(debtor => debtor.remainingBalance > 0)
    .sort((a, b) => b.remainingBalance - a.remainingBalance); // Highest debt first
  };

  const debtors = computeDebtors();

  // Create Invoice (Sale)
  const createInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    const invCount = invoices.length + 1;
    const invNum = `FACT-2026-${String(invCount).padStart(4, '0')}`;
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'inv-' + Date.now(),
      invoiceNumber: invNum,
    };

    // Update product stock and log stock movement
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    invoiceData.items.forEach(item => {
      setProducts(prev => {
        const next = prev.map(p => {
          if (p.id === item.productId) {
            const newStock = Math.max(0, p.currentStock - item.quantity);
            
            // Check stock alerts
            if (newStock === 0) {
              setNotifications(nPrev => {
                const nNext = [
                  {
                    id: 'notif-' + Date.now() + Math.random(),
                    type: 'out_of_stock' as const,
                    title: 'Rupture de Stock',
                    message: `Le produit ${p.name} est à présent en rupture de stock !`,
                    date: nowStr,
                    read: false,
                    severity: 'danger' as const,
                    linkTab: 'products'
                  },
                  ...nPrev
                ];
                updateDocValue('notifications', nNext);
                return nNext;
              });
            } else if (newStock <= p.minStock) {
              setNotifications(nPrev => {
                const nNext = [
                  {
                    id: 'notif-' + Date.now() + Math.random(),
                    type: 'low_stock' as const,
                    title: 'Stock Faible',
                    message: `Le produit ${p.name} a atteint son seuil minimum (${newStock}/${p.minStock}).`,
                    date: nowStr,
                    read: false,
                    severity: 'warning' as const,
                    linkTab: 'inventory'
                  },
                  ...nPrev
                ];
                updateDocValue('notifications', nNext);
                return nNext;
              });
            }

            // Log stock exit movement
            addStockMovement({
              date: nowStr,
              productId: p.id,
              productCode: p.code,
              productName: p.name,
              type: 'out',
              quantity: item.quantity,
              previousStock: p.currentStock,
              newStock: newStock,
              reference: invNum,
              reason: `Vente Facture ${invNum} (${newInvoice.customerName})`,
              location: p.location,
              performedBy: currentUser.name,
            });

            return { ...p, currentStock: newStock };
          }
          return p;
        });
        updateDocValue('products', next);
        return next;
      });
    });

    // Record immediate payment log if paidAmount > 0
    if (newInvoice.paidAmount > 0) {
      addPayment({
        reference: `REC-2026-${String(payments.length + 1).padStart(3, '0')}`,
        date: newInvoice.date,
        type: 'sale',
        targetId: newInvoice.id,
        targetNumber: invNum,
        entityId: newInvoice.customerId,
        entityName: newInvoice.customerName,
        amount: newInvoice.paidAmount,
        paymentMethod: newInvoice.paymentMethod,
        notes: `Paiement à la création de la facture ${invNum}`,
        receivedBy: currentUser.name,
      });
    }

    setInvoices(prev => {
      const next = [newInvoice, ...prev];
      updateDocValue('invoices', next);
      return next;
    });
    return newInvoice;
  };

  // Create Purchase Order
  const createPurchaseOrder = (purchaseData: Omit<PurchaseOrder, 'id' | 'orderNumber'>): PurchaseOrder => {
    const poCount = purchases.length + 1;
    const poNum = `BA-2026-${String(poCount).padStart(4, '0')}`;

    const newPO: PurchaseOrder = {
      ...purchaseData,
      id: 'po-' + Date.now(),
      orderNumber: poNum,
    };

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Increase product stock & log stock entry
    purchaseData.items.forEach(item => {
      setProducts(prev => {
        const next = prev.map(p => {
          if (p.id === item.productId) {
            const newStock = p.currentStock + item.quantity;
            
            addStockMovement({
              date: nowStr,
              productId: p.id,
              productCode: p.code,
              productName: p.name,
              type: 'in',
              quantity: item.quantity,
              previousStock: p.currentStock,
              newStock: newStock,
              reference: poNum,
              reason: `Réception Achat Bon ${poNum} (${newPO.supplierName})`,
              location: p.location,
              performedBy: currentUser.name,
            });

            return { ...p, currentStock: newStock, buyPrice: item.unitCost };
          }
          return p;
        });
        updateDocValue('products', next);
        return next;
      });
    });

    // Update supplier balance (debt owed to supplier = remainingAmount)
    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.id === newPO.supplierId) {
          return { ...s, balance: s.balance + newPO.remainingAmount };
        }
        return s;
      });
      updateDocValue('suppliers', next);
      return next;
    });

    // Record payment if paidAmount > 0
    if (newPO.paidAmount > 0) {
      addPayment({
        reference: `REC-2026-${String(payments.length + 1).padStart(3, '0')}`,
        date: newPO.date,
        type: 'purchase',
        targetId: newPO.id,
        targetNumber: poNum,
        entityId: newPO.supplierId,
        entityName: newPO.supplierName,
        amount: newPO.paidAmount,
        paymentMethod: 'transfer',
        notes: `Règlement d'achat ${poNum}`,
        receivedBy: currentUser.name,
      });
    }

    setPurchases(prev => {
      const next = [newPO, ...prev];
      updateDocValue('purchases', next);
      return next;
    });

    // Send notification
    setNotifications(prev => {
      const next = [
        {
          id: 'notif-' + Date.now(),
          type: 'new_purchase' as const,
          title: 'Nouveau Bon d\'Achat',
          message: `Bon d'achat ${poNum} enregistré pour ${newPO.supplierName} (${newPO.totalAmount.toLocaleString()} CFA).`,
          date: nowStr,
          read: false,
          severity: 'info' as const,
          linkTab: 'purchases',
        },
        ...prev
      ];
      updateDocValue('notifications', next);
      return next;
    });

    return newPO;
  };

  // Add Payment
  const addPayment = (paymentData: Omit<PaymentRecord, 'id'>): PaymentRecord => {
    const payRef = paymentData.reference || `REC-2026-${String(payments.length + 1).padStart(3, '0')}`;
    const newPay: PaymentRecord = {
      ...paymentData,
      id: 'pay-' + Date.now(),
      reference: payRef,
    };

    if (paymentData.type === 'sale') {
      // Update invoice paid & remaining amounts
      setInvoices(prev => {
        const next = prev.map(inv => {
          if (inv.id === paymentData.targetId) {
            const newPaid = inv.paidAmount + paymentData.amount;
            const newRemaining = Math.max(0, inv.totalAmount - newPaid);
            let newStatus = inv.status;
            if (newRemaining === 0) newStatus = 'paid';
            else if (newPaid > 0) newStatus = 'partial';
            return { ...inv, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
          }
          return inv;
        });
        updateDocValue('invoices', next);
        return next;
      });
    } else {
      // Update purchase paid & remaining amounts
      setPurchases(prev => {
        const next = prev.map(po => {
          if (po.id === paymentData.targetId) {
            const newPaid = po.paidAmount + paymentData.amount;
            const newRemaining = Math.max(0, po.totalAmount - newPaid);
            let newStatus = po.status;
            if (newRemaining === 0) newStatus = 'paid';
            else if (newPaid > 0) newStatus = 'partial';
            return { ...po, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
          }
          return po;
        });
        updateDocValue('purchases', next);
        return next;
      });

      // Reduce supplier debt balance
      setSuppliers(prev => {
        const next = prev.map(sup => {
          if (sup.id === paymentData.entityId) {
            return { ...sup, balance: Math.max(0, sup.balance - paymentData.amount) };
          }
          return sup;
        });
        updateDocValue('suppliers', next);
        return next;
      });
    }

    setPayments(prev => {
      const next = [newPay, ...prev];
      updateDocValue('payments', next);
      return next;
    });

    // Trigger payment notification
    setNotifications(prev => {
      const next = [
        {
          id: 'notif-' + Date.now(),
          type: 'payment_received' as const,
          title: 'Paiement Enregistré',
          message: `Paiement de ${paymentData.amount.toLocaleString()} CFA reçu de ${paymentData.entityName} (${paymentData.targetNumber}).`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          read: false,
          severity: 'success' as const,
          linkTab: 'payments',
        },
        ...prev
      ];
      updateDocValue('notifications', next);
      return next;
    });

    return newPay;
  };

  // Stock Movement Log
  const addStockMovement = (mov: Omit<StockMovement, 'id'>) => {
    const newMov: StockMovement = {
      ...mov,
      id: 'mov-' + Date.now(),
    };
    setStockMovements(prev => {
      const next = [newMov, ...prev];
      updateDocValue('stockMovements', next);
      return next;
    });
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      updateDocValue('notifications', next);
      return next;
    });
  };
  const clearAllNotifications = () => {
    setNotifications([]);
    updateDocValue('notifications', []);
  };

  // Reset Demo Data
  const resetDemoData = () => {
    setCompanySettings(initialCompanySettings);
    updateDocValue('settings', initialCompanySettings);

    setCategories(initialCategories);
    updateDocValue('categories', initialCategories);

    setProducts(initialProducts);
    updateDocValue('products', initialProducts);

    setSuppliers(initialSuppliers);
    updateDocValue('suppliers', initialSuppliers);

    setCustomers(initialCustomers);
    updateDocValue('customers', initialCustomers);

    setInvoices(initialInvoices);
    updateDocValue('invoices', initialInvoices);

    setPurchases(initialPurchases);
    updateDocValue('purchases', initialPurchases);

    setPayments(initialPayments);
    updateDocValue('payments', initialPayments);

    setStockMovements(initialStockMovements);
    updateDocValue('stockMovements', initialStockMovements);

    setNotifications(initialNotifications);
    updateDocValue('notifications', initialNotifications);

    setUsers(initialUsers);
    updateDocValue('users', initialUsers);

    setStores(initialStores);
    updateDocValue('stores', initialStores);

    localStorage.clear();
  };

  // Translation helper function
  const t = (key: string): string => {
    const langDict = translations[language] || {};
    return langDict[key] || key;
  };

  return (
    <ERPContext.Provider
      value={{
        activeTab,
        setActiveTab,
        language,
        setLanguage,
        theme,
        setTheme,
        currentUser,
        setCurrentUser,
        globalSearchOpen,
        setGlobalSearchOpen,

        companySettings,
        updateCompanySettings,

        categories,
        addCategory,
        updateCategory,
        deleteCategory,

        products,
        addProduct,
        updateProduct,
        deleteProduct,

        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,

        customers,
        addCustomer,
        updateCustomer,
        deleteCustomer,

        debtors,

        invoices,
        createInvoice,

        purchases,
        createPurchaseOrder,

        payments,
        addPayment,

        stockMovements,
        addStockMovement,

        notifications,
        markNotificationAsRead,
        clearAllNotifications,

        users,
        addUser,
        updateUser,
        deleteUser,
        stores,
        addStore,
        isAuthenticated,
        login,
        logout,
        resetDemoData,
        t,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
