// EmployeeRepository.java
package org.vgu.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.vgu.backend.enums.TypePosition;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Employee;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByAccount(Account account);

    Optional<Employee> findByAccountId(Long accountId);

    Optional<Employee> findByEmployeeCode(String employeeCode);

    List<Employee> findByPosition(String position);

    @Query("SELECT e FROM Employee e WHERE " +
            "LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.position) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.account.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.account.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(e.account.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Employee> findByKeyword(String keyword, Pageable pageable);

    List<Employee> findByPositionAndIsActiveTrue(TypePosition typePosition);
}
