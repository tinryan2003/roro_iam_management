package org.vgu.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.vgu.backend.model.Customer;
import org.vgu.backend.model.Account;
import java.util.Optional;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT COUNT(c) FROM Customer c")
    Long countAllCustomers();

    Optional<Customer> findByAccount(Account account);

    Optional<Customer> findByAccountId(Long accountId);

    Optional<Customer> findByCustomerCode(String customerCode);

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.account.isActive = true")
    Long countActiveCustomers();

    @Query("SELECT COUNT(c) FROM Customer c WHERE c.createdAt >= :startDate")
    Long countNewCustomersThisMonth(@Param("startDate") LocalDateTime startDate);

    @Query("SELECT c FROM Customer c WHERE " +
            "LOWER(c.customerCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.account.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.account.lastName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.account.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.account.username) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Customer> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
}