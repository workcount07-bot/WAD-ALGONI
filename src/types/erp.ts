export type Language = 'fr' | 'en' | 'ar';
export type Theme = 'light' | 'dark';

export type UserRole = 'admin' | 'manager' | 'stockkeeper' | 'cashier' | 'accountant';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  email: string;
  role: UserRole;
  storeName?: string;
  assignedProductIds?: string[];
  avatar?: string;
}

export interface Permission {
  role: UserRole;
  canManageProducts: boolean;
  canManageSales: boolean;
  canManagePurchases: boolean;
  canManageCustomers: boolean;
  canManageSuppliers: boolean;
  canManagePayments: boolean;
  canViewReports: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  categoryId: string;
  brand: string;
  unit: string; // e.g. 'pièce', 'kg', 'carton', 'litre', 'sac'
  photo?: string;
  description?: string;
  buyPrice: number;
  wholesalePrice: number;
  retailPrice: number;
  vatRate: number; // e.g. 18 for 18%
  currentStock: number;
  minStock: number;
  location: string; // e.g. 'Rayon A-04', 'Dépôt Principal'
  storeName?: string; // e.g. 'Toutes les boutiques', 'Boutique Dakar', 'Boutique Saint-Louis'
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  nif: string;
  rccm: string;
  balance: number; // debt owed to supplier by us
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  neighborhood: string;
  city: string;
  country: string;
  createdAt: string;
}

export type RiskLevel = 'green' | 'orange' | 'red';

export interface DebtorCustomer extends Customer {
  lastInvoiceDate: string;
  unpaidInvoiceCount: number;
  totalPurchased: number;
  totalPaid: number;
  remainingBalance: number;
  overdueDays: number;
  riskLevel: RiskLevel;
}

export type SaleType = 'retail' | 'wholesale';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'mobile_money';

export interface InvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  discount: number; // percentage or fixed amount
  subtotal: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // FACT-2026-0001
  date: string;
  dueDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  saleType: SaleType;
  items: InvoiceItem[];
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy: string;
  userId?: string;
  storeName?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  vatRate: number;
  discount: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string; // BA-2026-0001
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: PaymentStatus;
  notes?: string;
  createdBy: string;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  date: string;
  type: 'sale' | 'purchase';
  targetId: string; // invoiceId or purchaseId
  targetNumber: string; // FACT-xxxx or BA-xxxx
  entityId: string; // customerId or supplierId
  entityName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  receivedBy: string;
}

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'transfer' | 'audit';

export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productCode: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string; // e.g. FACT-001 or BA-002
  reason: string;
  location: string;
  performedBy: string;
}

export interface SystemNotification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'unpaid_invoice' | 'debtor_alert' | 'payment_received' | 'new_purchase';
  title: string;
  message: string;
  date: string;
  read: boolean;
  severity: 'info' | 'warning' | 'danger' | 'success';
  linkTab?: string;
}

export interface CompanySettings {
  name: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
  nif: string;
  rccm: string;
  defaultVatRate: number;
  currency: string;
  currencySymbol: string;
  language: Language;
  theme: Theme;
  autoBackup: boolean;
  receiptFooterText: string;
}
