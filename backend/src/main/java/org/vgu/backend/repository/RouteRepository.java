package org.vgu.backend.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.vgu.backend.model.Port;
import org.vgu.backend.model.Route;
import org.springframework.stereotype.Repository;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {

    List<Route> findByDeparturePortAndArrivalPort(Port departurePort, Port arrivalPort);

    List<Route> findByDeparturePort(Port departurePort);

    List<Route> findByIsActive(boolean isActive);

    Page<Route> findByIsActive(boolean isActive, Pageable pageable);
}