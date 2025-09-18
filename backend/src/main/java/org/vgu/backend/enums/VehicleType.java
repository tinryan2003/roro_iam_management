package org.vgu.backend.enums;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum VehicleType {
    CAR("Car", new BigDecimal("25.00")),
    TRUCK("Truck", new BigDecimal("50.00")),
    MOTORCYCLE("Motorcycle", new BigDecimal("15.00")),
    BUS("Bus", new BigDecimal("75.00")),
    VAN("Van", new BigDecimal("35.00"));

    private final String displayName;
    private final BigDecimal price;

    VehicleType(String displayName, BigDecimal price) {
        this.displayName = displayName;
        this.price = price;
    }

    @JsonValue
    public String getDisplayName() {
        return displayName;
    }

    public BigDecimal getPrice() {
        return price;
    }

    // Allow deserialization from both display name and enum name
    @JsonCreator
    public static VehicleType fromString(String value) {
        if (value == null)
            return null;

        // Try to match by display name first (case-insensitive)
        for (VehicleType type : VehicleType.values()) {
            if (type.displayName.equalsIgnoreCase(value)) {
                return type;
            }
        }

        // Try to match by enum name (case-insensitive)
        for (VehicleType type : VehicleType.values()) {
            if (type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Invalid vehicle type: " + value);
    }
}