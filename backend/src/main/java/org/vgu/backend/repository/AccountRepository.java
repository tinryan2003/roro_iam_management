package org.vgu.backend.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.vgu.backend.model.Account;
import org.springframework.stereotype.Repository;
import org.vgu.backend.enums.TypeClient;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByKeycloakId(String keycloakId);

    Optional<Account> findByUsername(String username);

    Optional<Account> findByUsernameOrEmail(String username, String email);

    Optional<Account> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT a FROM Account a WHERE " +
            "LOWER(a.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(a.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(a.firstName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(a.lastName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Account> findByKeyword(String keyword, Pageable pageable);

    Optional<Account> findByEmailAndPrimaryRole(String email, TypeClient primaryRole);

    boolean existsByEmailAndPrimaryRole(String email, TypeClient primaryRole);

    List<Account> findAllByEmail(String email);

    Page<Account> findAll(Pageable pageable);

    // Methods for async notification service
    List<Account> findByPrimaryRoleAndIsActiveTrue(TypeClient primaryRole);

    List<Account> findByPrimaryRoleInAndIsActiveTrue(List<TypeClient> primaryRoles);
}