export type UUID = string;

export enum Ownership {
  OWNED = 'OWNED',
  RENTED = 'RENTED'
}

export enum MovementType {
  RECEIVE = 'RECEIVE',
  TRANSFER = 'TRANSFER',
  SALE_OUT = 'SALE_OUT',
  ADJUSTMENT = 'ADJUSTMENT'
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PART_PAID = 'PART_PAID',
  PAID = 'PAID'
}

export enum WorkStatus {
  PLANNED = 'PLANNED',
  COMPLETED = 'COMPLETED'
}

export enum AllocationType {
  FIELD = 'FIELD',
  WORK = 'WORK',
  LOT = 'LOT',
  BIN = 'BIN',
  SEASON = 'SEASON',
  GENERAL = 'GENERAL'
}

export interface Profile {
  id: UUID;
  farm_id: UUID;
  display_name: string;
}

export interface Season {
  id: UUID;
  farm_id: UUID;
  name: string;
  is_current: boolean;
}

export interface Crop {
  id: UUID;
  name_ka: string;
}

export interface Variety {
  id: UUID;
  crop_id: UUID;
  name: string;
  crops?: Crop;
}

export interface Field {
  id: UUID;
  name: string;
  area_ha: number;
  location_text?: string;
  ownership: Ownership;
  notes?: string;
}

export interface Warehouse {
  id: UUID;
  name: string;
  location_text?: string;
}

export interface Bin {
  id: UUID;
  warehouse_id: UUID;
  name: string;
  is_default: boolean;
  active_lot_id?: UUID | null;
  lots?: Lot;
}

export interface Lot {
  id: UUID;
  lot_code: string;
  season_id: UUID;
  crop_id: UUID;
  variety_id: UUID;
  field_id: UUID;
  harvest_date: string;
  harvested_kg: number;
  crops?: Crop;
  varieties?: Variety;
  fields?: Field;
}

export interface Sale {
  id: UUID;
  lot_id: UUID;
  bin_id: UUID;
  buyer_id: UUID;
  sale_date: string;
  weight_kg: number;
  price_per_kg: number;
  total_gel: number;
  payment_status: PaymentStatus;
  notes?: string;
  lots?: Lot;
  buyers?: Buyer;
}

export interface Buyer {
  id: UUID;
  name: string;
  phone?: string;
}

export interface InventoryMovement {
  id: UUID;
  type: MovementType;
  lot_id: UUID;
  from_bin_id?: UUID;
  to_bin_id?: UUID;
  weight_kg: number;
  movement_date: string;
  reason?: string;
  lots?: Lot;
}

export interface StockView {
  farm_id: UUID;
  bin_id: UUID;
  lot_id: UUID;
  stock_kg: number;
}

export interface WorkType {
  id: UUID;
  farm_id: UUID;
  name: string;
}

export interface Work {
  id: UUID;
  farm_id: UUID;
  field_id: UUID;
  season_id: UUID;
  work_type_id: UUID;
  planned_date: string;
  completed_date?: string;
  status: WorkStatus;
  notes?: string;
  work_types?: WorkType;
  fields?: Field;
  seasons?: Season;
}

export interface Expense {
  id: UUID;
  farm_id: UUID;
  season_id: UUID;
  allocation_type: AllocationType;
  target_id?: UUID;
  amount_gel: number;
  expense_date: string;
  description?: string;
  seasons?: Season;
}

// Extended types for joined queries
export interface BinWithWarehouse extends Bin {
  warehouses?: Warehouse;
}

export interface LotWithCropVariety extends Lot {
  crops?: Crop;
  varieties?: Variety;
}

export interface StockViewWithRelations extends StockView {
  lots?: LotWithCropVariety;
  bins?: BinWithWarehouse;
}

export interface SaleWithRelations extends Sale {
  lots?: LotWithCropVariety;
  buyers?: Buyer;
}

export interface WorkWithRelations extends Work {
  work_types?: WorkType;
  fields?: Field;
}

export interface VarietyWithCrop extends Variety {
  crops?: Crop;
}

export interface ExpenseWithRelations extends Expense {
  work_types?: WorkType;
  fields?: Field;
  lots?: Lot;
}
