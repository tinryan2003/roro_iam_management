package org.vgu.backend.service.employee;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.vgu.backend.dto.request.EmployeeCreateRequest;
import org.vgu.backend.dto.request.EmployeeUpdateRequest;
import org.vgu.backend.dto.response.EmployeeResponse;
import org.vgu.backend.enums.TypePosition;
import org.vgu.backend.exception.DataNotFoundException;

import jakarta.validation.Valid;

public interface IEmployeeService {
    EmployeeResponse createEmployee(@Valid EmployeeCreateRequest request) throws Exception;

    EmployeeResponse updateEmployee(Long employeeId, @Valid EmployeeUpdateRequest request) throws DataNotFoundException;

    EmployeeResponse getEmployeeById(Long employeeId) throws DataNotFoundException;

    Page<EmployeeResponse> listAllEmployees(String keyword, Pageable pageable);

    void deleteEmployee(Long employeeId) throws DataNotFoundException;

    void reactivateEmployee(Long employeeId) throws DataNotFoundException;

    void blockOrEnableEmployee(Long employeeId, boolean block) throws DataNotFoundException;

    List<EmployeeResponse> getEmployeesByPosition(TypePosition position);
}