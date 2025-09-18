package org.vgu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vgu.backend.model.Port;
import java.util.Optional;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface PortRepository extends JpaRepository<Port, Long> {

    Optional<Port> findByPortCode(String portCode);

    List<Port> findByCountry(String country);

    List<Port> findByIsActive(boolean isActive);
}