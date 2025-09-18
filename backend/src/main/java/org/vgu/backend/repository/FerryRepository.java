package org.vgu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vgu.backend.enums.FerryStatus;
import org.vgu.backend.model.Ferry;
import java.util.Optional;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FerryRepository extends JpaRepository<Ferry, Long> {

    Optional<Ferry> findByFerryCode(String ferryCode);

    List<Ferry> findByStatus(FerryStatus status);

    @Query("SELECT COUNT(f) FROM Ferry f")
    Long countAllFerries();
}