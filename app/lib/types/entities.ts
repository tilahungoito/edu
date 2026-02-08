// ====================================
// CORE ENTITY TYPES
// ====================================

export type TenantType = 'bureau' | 'zone' | 'woreda' | 'kebele' | 'school';
export type EntityStatus = 'active' | 'inactive' | 'suspended';

// Base entity interface
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: EntityStatus;
}

// Zone Entity
export interface Zone extends BaseEntity {
    name: string;
    nameAmharic?: string;
    code: string;
    description?: string;
    totalWoredas: number;
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
}

// Woreda Entity
export interface Woreda extends BaseEntity {
    zoneId: string;
    zoneName?: string;
    name: string;
    nameAmharic?: string;
    code: string;
    description?: string;
    totalSchools: number;
    totalStudents: number;
    totalTeachers: number;
}

// School Types
export type SchoolType = 'primary' | 'secondary' | 'preparatory' | 'combined';
export type SchoolOwnership = 'government' | 'private' | 'religious' | 'ngo';

// School Entity
export interface School extends BaseEntity {
    woredaId: string;
    woredaName?: string;
    zoneId: string;
    zoneName?: string;
    name: string;
    nameAmharic?: string;
    code: string;
    type: SchoolType;
    ownership: SchoolOwnership;
    address?: string;
    phone?: string;
    email?: string;
    principalName?: string;
    establishedYear?: number;
    totalStudents: number;
    totalTeachers: number;
    totalStaff: number;
    latitude?: number;
    longitude?: number;
}

// ====================================
// STAFF & HR TYPES
// ====================================

export type StaffPosition =
    | 'teacher'
    | 'principal'
    | 'vice_principal'
    | 'department_head'
    | 'admin_staff'
    | 'support_staff';

export type EducationLevel =
    | 'certificate'
    | 'diploma'
    | 'degree'
    | 'masters'
    | 'phd';

export type Gender = 'male' | 'female';

export interface Staff extends BaseEntity {
    schoolId: string;
    schoolName?: string;
    woredaId: string;
    zoneId: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    fatherName: string;
    gender: Gender;
    dateOfBirth: Date;
    phone?: string;
    email?: string;
    position: StaffPosition;
    subject?: string;
    educationLevel: EducationLevel;
    qualification?: string;
    hireDate: Date;
    salary?: number;
    yearsOfExperience: number;
}

// ====================================
// HR TRANSFER TYPES
// ====================================

export type TransferStatus =
    | 'draft'
    | 'pending_school'
    | 'pending_woreda'
    | 'pending_zone'
    | 'pending_bureau'
    | 'approved'
    | 'rejected'
    | 'cancelled';

export type TransferType =
    | 'permanent'
    | 'temporary'
    | 'promotion'
    | 'disciplinary';

export interface TransferApproval {
    level: TenantType;
    approvedBy?: string;
    approvedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
}

export interface HRTransfer extends BaseEntity {
    staffId: string;
    staffName?: string;
    fromSchoolId: string;
    fromSchoolName?: string;
    fromWoredaId: string;
    fromZoneId: string;
    toSchoolId: string;
    toSchoolName?: string;
    toWoredaId: string;
    toZoneId: string;
    transferType: TransferType;
    reason: string;
    requestedBy: string;
    requestedAt: Date;
    effectiveDate?: Date;
    approvals: TransferApproval[];
    currentStatus: TransferStatus;
    attachments?: string[];
}

// ====================================
// INVENTORY TYPES
// ====================================

export type AssetCategory =
    | 'furniture'
    | 'electronics'
    | 'equipment'
    | 'vehicles'
    | 'buildings'
    | 'other';

export type AssetCondition =
    | 'new'
    | 'good'
    | 'fair'
    | 'poor'
    | 'damaged'
    | 'disposed';

export interface Asset extends BaseEntity {
    schoolId?: string;
    woredaId?: string;
    zoneId?: string;
    tenantType: TenantType;
    assetCode: string;
    name: string;
    category: AssetCategory;
    description?: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    condition: AssetCondition;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    location?: string;
    assignedTo?: string;
}

export type SupplyCategory =
    | 'stationery'
    | 'cleaning'
    | 'educational'
    | 'medical'
    | 'sports'
    | 'other';

export interface Supply extends BaseEntity {
    schoolId?: string;
    woredaId?: string;
    zoneId?: string;
    tenantType: TenantType;
    supplyCode: string;
    name: string;
    category: SupplyCategory;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    reorderLevel: number;
    lastRestocked?: Date;
}

export type InventoryRequestStatus =
    | 'draft'
    | 'pending'
    | 'approved'
    | 'partial'
    | 'fulfilled'
    | 'rejected';

export interface InventoryRequest extends BaseEntity {
    requestedBy: string;
    requestedByName?: string;
    fromTenantType: TenantType;
    fromTenantId: string;
    toTenantType: TenantType;
    toTenantId: string;
    items: InventoryRequestItem[];
    requestStatus: InventoryRequestStatus;
    notes?: string;
    approvedBy?: string;
    approvedAt?: Date;
}

export interface InventoryRequestItem {
    assetId?: string;
    supplyId?: string;
    itemName: string;
    quantityRequested: number;
    quantityApproved?: number;
    quantityFulfilled?: number;
}

// ====================================
// BUDGET TYPES
// ====================================

export type BudgetCategory =
    | 'salaries'
    | 'operations'
    | 'maintenance'
    | 'supplies'
    | 'equipment'
    | 'infrastructure'
    | 'training'
    | 'other';

export type FiscalPeriod = 'monthly' | 'quarterly' | 'annual';

export interface BudgetAllocation extends BaseEntity {
    fiscalYear: number;
    fiscalPeriod: FiscalPeriod;
    allocatedTo: TenantType;
    allocatedToId: string;
    allocatedToName?: string;
    allocatedBy: string;
    category: BudgetCategory;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    notes?: string;
}

export type BudgetRequestStatus =
    | 'draft'
    | 'pending'
    | 'approved'
    | 'partial'
    | 'rejected';

export interface BudgetRequest extends BaseEntity {
    fiscalYear: number;
    requestedBy: string;
    requestedByName?: string;
    fromTenantType: TenantType;
    fromTenantId: string;
    category: BudgetCategory;
    requestedAmount: number;
    approvedAmount?: number;
    justification: string;
    requestStatus: BudgetRequestStatus;
    approvedBy?: string;
    approvedAt?: Date;
    comments?: string;
}

export interface Expenditure extends BaseEntity {
    budgetAllocationId: string;
    schoolId?: string;
    woredaId?: string;
    zoneId?: string;
    tenantType: TenantType;
    category: BudgetCategory;
    description: string;
    amount: number;
    receipt?: string;
    expenditureDate: Date;
    recordedBy: string;
}

// ====================================
// ANALYTICS TYPES
// ====================================

export interface KPIData {
    label: string;
    value: number | string;
    previousValue?: number;
    change?: number;
    changePercent?: number;
    trend?: 'up' | 'down' | 'stable';
    icon?: string;
}

export interface ChartDataPoint {
    name: string;
    value: number;
    [key: string]: string | number;
}

export interface AnalyticsFilter {
    zoneId?: string;
    woredaId?: string;
    schoolId?: string;
    startDate?: Date;
    endDate?: Date;
    category?: string;
}

// ====================================
// AUDIT LOG TYPES
// ====================================

export interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId?: string;
    payload?: any;
    userId?: string;
    user?: {
        id: string;
        username: string;
        email: string;
    };
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}

export interface AuditLogFilter {
    limit?: number;
    offset?: number;
    action?: string;
    entity?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}

