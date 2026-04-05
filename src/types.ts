export type UserRole = 'SuperAdmin' | 'Admin' | 'WarehouseOperator' | 'ProductionOperator' | 'CNCOperator' | 'FinishingOperator' | 'WasteOperator' | 'Salesperson' | string;

export interface ERPPermission {
  id: number;
  name: string;
  key: string;
}

export interface ERPRole {
  id: number;
  name: string;
  permissions: number[];
  permissions_detail: ERPPermission[];
}

export interface Material {
  id: number;
  name: string;
  sku?: string;
  category?: 'RAW' | 'SEMI' | 'FINISHED' | 'OTHER';
  category_display?: string;
  unit: string;
  price?: number;
  description?: string;
}

export interface RawMaterialBatch {
  id: number;
  invoice_number: string;
  supplier_name: string;
  date: string;
  quantity_kg: number;
  remaining_quantity: number;
  reserved_quantity: number;
  batch_number: string;
  price_per_unit: number;
  status: 'RECEIVED' | 'INSPECTION' | 'IN_STOCK' | 'RESERVED' | 'DEPLETED' | 'CANCELLED';
  responsible_user_name?: string;
  material_name?: string;
}

export interface Product {
  id: string | number;
  name: string;
  unit: string;
  type?: string;
  price?: number;
}

export interface User {
  id: string | number;
  name: string;
  full_name?: string;
  username: string;
  phone?: string;
  email?: string;
  role: string;
  role_id?: number;
  role_detail?: ERPRole;
  role_display?: string;
  effective_role?: string;
  all_permissions?: string[];
  responsibility_summary?: string;
  task_scope?: string[];
  status?: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  start_date?: string;
  pin_code?: string;
  telegram_id?: string;
  is_2fa?: boolean;
  lastLogin?: string;
  department?: number;
  department_id?: number;
  department_name?: string;
  notes?: string;
  last_login_ip?: string;
  assigned_warehouses?: (number | string)[];
  assignedWarehouses?: (number | string)[];
  assigned_warehouse_names?: string[];
  is_superuser?: boolean;
}

export type DocumentType = 
  | 'HISOB_FAKTURA_KIRIM' 
  | 'HISOB_FAKTURA_CHIQIM' 
  | 'ICHKI_YUK_XATI' 
  | 'OTKAZMA_BUYRUGI' 
  | 'PRODUCTION_ORDER' 
  | 'ISSUE_ORDER' 
  | 'ZAMES_LOG' 
  | 'BUNKER_ENTRY' 
  | 'FORMOVKA_LOG' 
  | 'STAGE_UPDATE' 
  | 'BUYURTMA_NARYAD';

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface ERPDocument {
  id: string | number;
  number: string;
  type: DocumentType;
  type_label?: string;
  date?: string;
  created_at?: string;
  from_entity_name?: string;
  to_entity_name?: string;
  from_warehouse?: number;
  to_warehouse?: number;
  items: {
    id: string | number;
    product_name?: string;
    product?: number;
    quantity: number;
    unit?: string;
    batch_number?: string;
    price_at_moment?: number;
  }[];
  created_by_name?: string;
  status: 'PENDING' | 'CREATED' | 'CONFIRMED' | 'APPROVED' | 'IN_PROGRESS' | 'IN_TRANSIT' | 'DONE' | 'CANCELLED' | 'RETURNED';
  status_label?: string;
  qr_code?: string;
  total_amount?: number;
  currency?: string;
  supplier_name?: string;
}

export interface StockTransaction {
  id: string;
  documentId: string;
  productId: string;
  productName: string;
  quantity: number;
  fromDepartment: Department;
  toDepartment: Department;
  timestamp: string;
  status: 'Pending' | 'Completed';
}

export interface UserAction {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module?: string;
  description?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  status?: 'SUCCESS' | 'ERROR' | 'WARNING';
}

export interface RawMaterial {
  id: string | number;
  sourceDocumentId: string; // HISOB_FAKTURA_KIRIM
  supplier: string;
  date: string;
  quantity: number;
  weight?: number;
  batchNumber: string;
  responsiblePerson: string;
  status: 'InStock' | 'InProduction' | 'Used' | 'Reserved' | string;
  price?: number;
  currency?: string;
  code?: string;
}

export interface RecipeItem {
  id: number;
  material: number;
  material_name: string;
  quantity: number;
}

export interface Recipe {
  id: number;
  name: string;
  description: string;
  items: RecipeItem[];
}

export interface ZamesItem {
  id: number;
  material: number;
  material_name: string;
  batch: number | null;
  batch_number?: string;
  quantity: number;
}
export type ProductionStage = 'Casting' | 'Bunker' | 'CNC' | 'Finishing' | 'All' | 'READY' | 'ZAMES' | 'DRYING' | 'FORMOVKA' | 'BLOK' | 'DEKOR';

export interface ProductionOrderStage {
  id: number;
  order: number;
  stage_type: 'ZAMES' | 'DRYING' | 'BUNKER' | 'FORMOVKA' | 'BLOK' | 'CNC' | 'DEKOR';
  stage_type_display: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  status_display: string;
  sequence: number;
  started_at: string | null;
  completed_at: string | null;
  responsible: number | null;
  related_id: number | null;
}

export interface ProductionOrder {
  id: number | string;
  order_number: string;
  orderNumber?: string; // Alias for backward compatibility
  product: number | string;
  product_name: string;
  productName?: string; // Alias
  quantity: number;
  quantityNeeded?: number; // Alias
  quantityProduced?: number; // Alias
  status: 'PENDING' | 'PLANNED' | 'IN_PROGRESS' | 'QC_PENDING' | 'REPAIR' | 'DELAYED' | 'COMPLETED' | 'CANCELLED' | 'InProduction' | 'Pending' | 'Overdue';
  status_display?: string;
  progress: number;
  current_stage?: ProductionStage | string;
  currentStage?: ProductionStage | string; // Alias
  start_date: string | null;
  deadline: string | null;
  endDate?: string | null; // Alias
  responsible: number | null;
  responsible_name?: string;
  source_order?: string;
  orderId?: string; // Alias
  stages?: ProductionOrderStage[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductionPlan {
  id: number;
  date: string;
  shift: 'DAY' | 'NIGHT';
  shift_display: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
  status_display: string;
  target_volume: number;
  actual_volume: number;
  start_time: string | null;
  end_time: string | null;
  notes: string;
  orders: number[];
  orders_detail?: ProductionOrder[];
}

export interface QualityCheck {
  id: number;
  order: number;
  order_number: string;
  stage?: number;
  status: 'PASSED' | 'FAILED' | 'PENDING';
  status_display: string;
  notes: string;
  waste_weight: number;
  inspector: number;
  inspector_name: string;
  created_at: string;
}

export interface Zames {
  id: number;
  zames_number: string;
  recipe: number | null;
  recipe_name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  start_time: string | null;
  end_time: string | null;
  input_weight: number;
  output_weight: number;
  operator: number;
  operator_name: string;
  machine_id: string | null;
  created_at: string;
  items: ZamesItem[];
}

export interface Bunker {
  id: string;
  bunkerNumber: number;
  batchNumber: string; // This is resultBatchNumber from Zames
  loadedAt: string;
  agingTimeHours: number;
  status: 'Empty' | 'Aging' | 'Ready';
}

export interface BlockProduction {
  id: number;
  zames: number;
  zames_number: string;
  form_number: string;
  block_count: number;
  length: number;
  width: number;
  height: number;
  density: number;
  volume: number;
  weight_per_block: number;
  status: 'DRYING' | 'READY' | 'DEFECT' | 'RESERVED' | 'SOLD';
  status_display?: string;
  warehouse: number | null;
  date: string;
}

export interface Block {
  id: number;
  batchNumber: string;
  quantity: number;
  location: string;
  thickness?: number;
  density?: string;
  productId?: number | string;
}

export interface Transfer {
  id: string;
  batchNumber: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  date: string;
  status: 'CREATED' | 'APPROVED' | 'IN_TRANSIT' | 'DONE' | 'CANCELLED' | 'RETURNED';
  productName?: string;
  unit?: string;
}

export interface DecorativeProduct {
  id: string | number;
  batchNumber: string;
  itemName: string;
  quantity: number;
  operator: string;
  status: string;
  date: string;
  sku?: string;
  category?: string;
  price?: number;
}

export interface Inventory {
  id: number;
  product: number;
  warehouse: number;
  quantity: number;
  batch_number: string | null;
  supplier: string | null;
  created_at: string;
  product_details: Material;
  warehouse_details?: any;
}

export interface SaleRequest {
  warehouse_id: number;
  customer_id: number;
  items: {
    product_id: number;
    quantity: number;
    price: number;
    batch_number?: string;
  }[];
}

export interface WasteLog {
  id: string;
  sourceStep: 'CNC' | 'Production' | 'Finishing';
  quantity: number;
  unit: 'kg' | 'm3';
  operator: string;
  date: string;
}


export type OrderStatus = 'New' | 'WaitingProduction' | 'InProduction' | 'Ready' | 'Shipped' | 'Cancelled';

// Unified Production Order Types (Replaces legacy definitions)

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  date: string;
  deliveryDate?: string;
  responsiblePerson: string;
  notes?: string;
}

export interface SaleItem {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  customer: number;
  customer_name: string;
  date: string;
  total_amount: number;
  status: 'NEW' | 'CONFIRMED' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'EN_ROUTE' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  status_display: string;
  payment_method: 'CASH' | 'BANK' | 'CARD' | 'DEBT';
  payment_method_display: string;
  delivery_address: string;
  notes: string;
  items: SaleItem[];
  created_by_name?: string;
  discount_amount: number;
  manager_limit_approval: boolean;
  production_order_id: number | null;
}

export interface ContactLog {
  id: number;
  customer: number;
  manager: number;
  manager_name: string;
  contact_type: 'CALL' | 'MEETING' | 'TELEGRAM' | 'EMAIL' | 'OTHER';
  notes: string;
  follow_up_date: string | null;
  created_at: string;
}

export interface Sale {
  id: string | number;
  orderId?: string;
  invoiceDocumentId?: string;
  customer?: string;
  customer_name?: string;
  date: string;
  totalAmount?: number;
  total_amount?: number;
  type?: 'Wholesale' | 'Retail';
}

export interface Client {
  id: number;
  name: string;
  company_name?: string;
  phone: string;
  secondary_phone?: string;
  email?: string;
  address: string;
  balance: number;
  stir_inn?: string;
  customer_type: 'WHOLESALE' | 'RETAIL';
  customer_type_display?: string;
  credit_limit: number;
  total_purchased?: number;
  orders_count?: number;
  lastOrderDate?: string;
  created_at?: string;
  lead_status: 'LEAD' | 'NEGOTIATION' | 'WON' | 'LOST';
  interest_level: 'HIGH' | 'MEDIUM' | 'LOW';
  assigned_manager: number | null;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

// Finance Module Types
export interface Cashbox {
  id: string | number;
  name: string;
  type: 'CASH' | 'BANK' | 'CARD';
  type_display?: string;
  balance: number | string;
  branch?: string;
  responsible_person?: number | string;
  responsible_person_name?: string;
  is_active: boolean;
}

export interface ExpenseCategory {
  id: string | number;
  name: string;
  description?: string;
}

export interface FinancialTransaction {
  id: string | number;
  cashbox: string | number;
  cashbox_name?: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  department?: 'ADMIN' | 'PRODUCTION' | 'LOGISTICS' | 'SALES' | 'OTHER';
  department_display?: string;
  category?: string | number;
  category_name?: string;
  customer?: string | number;
  customer_name?: string;
  description?: string;
  performed_by?: string | number;
  performed_by_name?: string;
  attachment?: string;
  created_at: string;
}

export interface InternalTransfer {
  id: string | number;
  from_cashbox: string | number;
  from_cashbox_name?: string;
  to_cashbox: string | number;
  to_cashbox_name?: string;
  amount: number | string;
  description?: string;
  performed_by?: string | number;
  performed_by_name?: string;
  created_at: string;
}

export interface WarehouseTransfer {
  id: number;
  from_warehouse: number;
  to_warehouse: number;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
  material: number;
  material_name?: string;
  quantity: number;
  date: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
}

export interface ClientBalance {
  id: string | number;
  customer: string | number;
  customer_name?: string;
  total_debt: number | string;
  last_updated: string;
}

export interface FinishingStageLog {
  id: number;
  job: number;
  stage: 'ARMIRLASH' | 'SHPAKLYOVKA' | 'DRYING' | 'READY';
  stage_display: string;
  started_at: string;
  ended_at: string | null;
  operator: number | null;
  operator_name?: string;
}

export interface FinishingJob {
  id: number;
  job_number: string;
  cnc_job: number | null;
  product: number;
  product_name: string;
  quantity: number;
  current_stage: 'ARMIRLASH' | 'SHPAKLYOVKA' | 'DRYING' | 'READY';
  stage_display: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  status_display: string;
  operator: number | null;
  operator_name?: string;
  notes: string | null;
  progress: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  stage_logs?: FinishingStageLog[];
}
export interface WasteCategory {
  id: number;
  name: string;
  norm_percent: number;
  description: string;
}

export interface WasteTask {
  id: number;
  task_number: string;
  source_department: 'CNC' | 'FINISHING' | 'PRODUCTION' | 'WAREHOUSE' | 'OTHER';
  dept_display: string;
  batch_number: string;
  category: number;
  category_name: string;
  weight_kg: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  status_display: string;
  operator: number | null;
  operator_name?: string;
  created_at: string;
  last_started_at: string | null;
  finished_at: string | null;
  total_duration_seconds: number;
  recycled_weight_kg: number;
  loss_weight_kg: number;
  notes: string | null;
}

export interface Delivery {
  id: number;
  invoice: number;
  invoice_number: string;
  courier: number | null;
  courier_name?: string;
  status: 'PENDING' | 'EN_ROUTE' | 'DELIVERED' | 'CANCELLED';
  status_display: string;
  customer_name: string;
  address: string;
  started_at: string | null;
  delivered_at: string | null;
  notes: string;
}
