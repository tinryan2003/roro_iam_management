package org.vgu.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.RouteCreateRequest;
import org.vgu.backend.dto.request.RouteUpdateRequest;
import org.vgu.backend.dto.response.RouteResponse;
import org.vgu.backend.model.Port;
import org.vgu.backend.model.Route;
import org.vgu.backend.repository.PortRepository;
import org.vgu.backend.repository.RouteRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/routes")
@RequiredArgsConstructor
@Slf4j
public class RouteController {

    private final RouteRepository routeRepository;
    private final PortRepository portRepository;

    /**
     * Get all routes with pagination (Public endpoint)
     */
    @GetMapping
    public ResponseEntity<Page<RouteResponse>> getAllRoutes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "false") boolean active) {
        log.info("Getting all routes with pagination: page={}, limit={}, activeOnly={}", page, limit, active);

        Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
        Page<Route> routes;

        if (active) {
            routes = routeRepository.findByIsActive(true, pageable);
        } else {
            routes = routeRepository.findAll(pageable);
        }

        Page<RouteResponse> routeResponses = routes.map(RouteResponse::from);
        log.info("Routes listed successfully: {} routes found", routeResponses.getTotalElements());
        return ResponseEntity.ok(routeResponses);
    }

    /**
     * Get all active routes (Public endpoint for customer booking)
     */
    @GetMapping("/active")
    public ResponseEntity<List<RouteResponse>> getActiveRoutes() {
        log.info("Getting all active routes");
        List<Route> routes = routeRepository.findByIsActive(true);
        List<RouteResponse> routeResponses = routes.stream()
                .map(RouteResponse::from)
                .collect(Collectors.toList());
        log.info("Active routes listed successfully: {} routes found", routeResponses.size());
        return ResponseEntity.ok(routeResponses);
    }

    /**
     * Get route by ID (Public endpoint)
     */
    @GetMapping("/{id}")
    public ResponseEntity<RouteResponse> getRouteById(@PathVariable Long id) {
        log.info("Getting route by ID: {}", id);
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + id));
        RouteResponse routeResponse = RouteResponse.from(route);
        log.info("Route retrieved successfully");
        return ResponseEntity.ok(routeResponse);
    }

    /**
     * Create a new route
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PLANNER')")
    public ResponseEntity<RouteResponse> createRoute(@Valid @RequestBody RouteCreateRequest request) {
        log.info("Creating new route: {}", request.getRouteName());

        // Validate departure and arrival ports exist and are active
        Port departurePort = portRepository.findById(request.getDeparturePortId())
                .orElseThrow(() -> new RuntimeException(
                        "Departure port not found with id: " + request.getDeparturePortId()));
        Port arrivalPort = portRepository.findById(request.getArrivalPortId())
                .orElseThrow(
                        () -> new RuntimeException("Arrival port not found with id: " + request.getArrivalPortId()));

        if (!departurePort.getIsActive()) {
            throw new RuntimeException("Departure port is not active");
        }
        if (!arrivalPort.getIsActive()) {
            throw new RuntimeException("Arrival port is not active");
        }
        if (departurePort.getId().equals(arrivalPort.getId())) {
            throw new RuntimeException("Departure and arrival ports cannot be the same");
        }

        // Create the route
        Route route = Route.builder()
                .routeName(request.getRouteName())
                .departurePort(departurePort)
                .arrivalPort(arrivalPort)
                .durationHours(request.getDurationHours())
                .price(request.getPrice())
                .isActive(request.getIsActive())
                .build();

        Route savedRoute = routeRepository.save(route);
        RouteResponse routeResponse = RouteResponse.from(savedRoute);
        log.info("Route created successfully with ID: {}", savedRoute.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(routeResponse);
    }

    /**
     * Update an existing route
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PLANNER')")
    public ResponseEntity<RouteResponse> updateRoute(@PathVariable Long id,
            @Valid @RequestBody RouteUpdateRequest request) {
        log.info("Updating route with ID: {}", id);

        // Find the existing route
        Route existingRoute = routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + id));

        // Validate departure and arrival ports exist and are active
        Port departurePort = portRepository.findById(request.getDeparturePortId())
                .orElseThrow(() -> new RuntimeException(
                        "Departure port not found with id: " + request.getDeparturePortId()));
        Port arrivalPort = portRepository.findById(request.getArrivalPortId())
                .orElseThrow(
                        () -> new RuntimeException("Arrival port not found with id: " + request.getArrivalPortId()));

        if (!departurePort.getIsActive()) {
            throw new RuntimeException("Departure port is not active");
        }
        if (!arrivalPort.getIsActive()) {
            throw new RuntimeException("Arrival port is not active");
        }
        if (departurePort.getId().equals(arrivalPort.getId())) {
            throw new RuntimeException("Departure and arrival ports cannot be the same");
        }

        // Update the route
        existingRoute.setRouteName(request.getRouteName());
        existingRoute.setDeparturePort(departurePort);
        existingRoute.setArrivalPort(arrivalPort);
        existingRoute.setDurationHours(request.getDurationHours());
        existingRoute.setPrice(request.getPrice());
        existingRoute.setIsActive(request.getIsActive());

        Route updatedRoute = routeRepository.save(existingRoute);
        RouteResponse routeResponse = RouteResponse.from(updatedRoute);
        log.info("Route updated successfully");
        return ResponseEntity.ok(routeResponse);
    }

    /**
     * Delete a route
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_PLANNER')")
    public ResponseEntity<Void> deleteRoute(@PathVariable Long id) {
        log.info("Deleting route with ID: {}", id);

        // Check if route exists
        Route route = routeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Route not found with id: " + id));

        // TODO: Check if route is used in any schedules before deletion
        // For now, we'll proceed with deletion

        routeRepository.delete(route);
        log.info("Route deleted successfully");
        return ResponseEntity.noContent().build();
    }
}
