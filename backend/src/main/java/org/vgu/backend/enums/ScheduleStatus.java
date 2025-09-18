package org.vgu.backend.enums;

public enum ScheduleStatus {
    SCHEDULED, // Normal scheduled departure
    BOARDING, // Currently boarding passengers/vehicles
    DEPARTED, // Ferry has left
    ARRIVED, // Ferry has arrived at destination
    CANCELLED, // Departure cancelled
    DELAYED, // Departure delayed
    MAINTENANCE, // Ferry unavailable due to maintenance
    WEATHER_HOLD // Delayed due to weather conditions
}
