package org.vgu.backend.controllers;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.response.PortResponse;
import org.vgu.backend.model.Port;
import org.vgu.backend.repository.PortRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/ports")
@RequiredArgsConstructor
@Slf4j
public class PortController {

    private final PortRepository portRepository;

    /**
     * Get all active ports (Public endpoint)
     */
    @GetMapping
    public ResponseEntity<List<PortResponse>> getAllActivePorts() {
        log.info("Getting all active ports");
        List<Port> ports = portRepository.findByIsActive(true);
        List<PortResponse> portResponses = ports.stream()
                .map(PortResponse::from)
                .collect(Collectors.toList());
        log.info("Active ports listed successfully: {} ports found", portResponses.size());
        return ResponseEntity.ok(portResponses);
    }
}