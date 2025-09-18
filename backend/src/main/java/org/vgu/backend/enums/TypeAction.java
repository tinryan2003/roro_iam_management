package org.vgu.backend.enums;

/**
 * Enum defining the types of actions that can be performed in the RoRo
 * Management System.
 * Used for audit logging, activity tracking, and system monitoring.
 */
public enum TypeAction {

    // Authentication & Authorization Actions
    LOGIN,
    LOGOUT,
    LOGIN_FAILED,
    AUTHORIZATION_DENIED,
    PASSWORD_RESET,
    PASSWORD_CHANGED,

    // Account Management Actions
    USER_CREATED,
    USER_UPDATED,
    USER_DELETED,
    USER_BLOCKED,
    USER_ENABLED,
    USER_VIEWED,
    USER_SEARCHED,

    // Role Management Actions
    ROLE_ASSIGNED,
    ROLE_REVOKED,
    ROLE_CREATED,
    ROLE_UPDATED,
    ROLE_DELETED,

    // Vehicle Management Actions
    VEHICLE_REGISTERED,
    VEHICLE_UPDATED,
    VEHICLE_DELETED,
    VEHICLE_INSPECTED,
    VEHICLE_STATUS_CHANGED,
    VEHICLE_SEARCHED,

    // Booking & Reservation Actions
    BOOKING_CREATED,
    BOOKING_UPDATED,
    BOOKING_CANCELLED,
    BOOKING_CONFIRMED,
    BOOKING_COMPLETED,
    BOOKING_SEARCHED,

    // Customer Management Actions
    CUSTOMER_REGISTERED,
    CUSTOMER_UPDATED,
    CUSTOMER_DELETED,
    CUSTOMER_VIEWED,
    CUSTOMER_SEARCHED,

    // Employee Management Actions
    EMPLOYEE_CREATED,
    EMPLOYEE_UPDATED,
    EMPLOYEE_DELETED,
    EMPLOYEE_VIEWED,
    EMPLOYEE_SEARCHED,

    // System Administration Actions
    SYSTEM_CONFIG_UPDATED,
    BACKUP_CREATED,
    BACKUP_RESTORED,
    DATABASE_MAINTENANCE,
    SECURITY_AUDIT,

    // Financial Actions
    PAYMENT_PROCESSED,
    PAYMENT_REFUNDED,
    INVOICE_GENERATED,
    INVOICE_SENT,
    FINANCIAL_REPORT_GENERATED,

    // Reporting & Analytics Actions
    REPORT_GENERATED,
    REPORT_VIEWED,
    REPORT_EXPORTED,
    ANALYTICS_VIEWED,

    // Ferry Operations Actions
    FERRY_SCHEDULE_CREATED,
    FERRY_SCHEDULE_UPDATED,
    FERRY_DEPARTURE,
    FERRY_ARRIVAL,
    FERRY_CANCELLED,

    // Port Operations Actions
    PORT_ENTRY_RECORDED,
    PORT_EXIT_RECORDED,
    CARGO_LOADED,
    CARGO_UNLOADED,

    // Security & Compliance Actions
    SECURITY_CHECK_PERFORMED,
    COMPLIANCE_AUDIT,
    INCIDENT_REPORTED,
    INCIDENT_RESOLVED,

    // Data Management Actions
    DATA_IMPORTED,
    DATA_EXPORTED,
    DATA_BACKUP,
    DATA_RESTORED,
    DATA_PURGED,

    // Communication Actions
    NOTIFICATION_SENT,
    EMAIL_SENT,
    SMS_SENT,
    ANNOUNCEMENT_CREATED,
    ANNOUNCEMENT_UPDATED,

    // General System Actions
    SYSTEM_STARTUP,
    SYSTEM_SHUTDOWN,
    CONFIGURATION_CHANGED,
    MAINTENANCE_STARTED,
    MAINTENANCE_COMPLETED,

    // Error & Exception Actions
    ERROR_OCCURRED,
    EXCEPTION_HANDLED,
    SYSTEM_ALERT,

    // File Operations
    FILE_UPLOADED,
    FILE_DOWNLOADED,
    FILE_DELETED,
    DOCUMENT_GENERATED,

    // API Actions
    API_REQUEST_RECEIVED,
    API_RESPONSE_SENT,
    API_ERROR,

    // Generic CRUD Operations
    RECORD_CREATED,
    RECORD_UPDATED,
    RECORD_DELETED,
    RECORD_VIEWED,
    RECORD_SEARCHED
}