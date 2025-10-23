export enum PermissionsEnum {
    BROKER = 'BROKER',
    SUPERADMIN = 'SUPER_ADMIN',
    FINANCE_ADMIN = 'FINANCE_ADMIN',
    FINANCE = 'FINANCE',
    LEGAL_ADMIN = 'LEGAL_ADMIN',
    LEGAL = 'LEGAL'
}

export const STAFF_ROLES = [
    PermissionsEnum.SUPERADMIN,
    PermissionsEnum.FINANCE_ADMIN,
    PermissionsEnum.FINANCE,
    PermissionsEnum.LEGAL_ADMIN,
    PermissionsEnum.LEGAL,
];
