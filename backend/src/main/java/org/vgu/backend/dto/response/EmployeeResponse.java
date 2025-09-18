package org.vgu.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.vgu.backend.enums.TypePosition;
import org.vgu.backend.model.Employee;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmployeeResponse {

    // Employee fields
    private Long employeeId;
    private String employeeCode;
    private TypePosition position;
    private LocalDate hireDate;
    private BigDecimal salary;
    private boolean isActive;

    // Account fields
    private Long accountId;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private LocalDate dateOfBirth;

    public static EmployeeResponse fromEntity(Employee employee) {
        return EmployeeResponse.builder()
                .employeeId(employee.getId())
                .employeeCode(employee.getEmployeeCode())
                .position(employee.getPosition())
                .hireDate(employee.getHireDate())
                .salary(employee.getSalary())
                .isActive(employee.getAccount().isActive())

                .accountId(employee.getAccount().getId())
                .username(employee.getAccount().getUsername())
                .email(employee.getAccount().getEmail())
                .firstName(employee.getAccount().getFirstName())
                .lastName(employee.getAccount().getLastName())
                .phoneNumber(employee.getAccount().getPhoneNumber())
                .dateOfBirth(employee.getAccount().getDateOfBirth())
                .build();
    }
}