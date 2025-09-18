package org.vgu.backend.service.ferry;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.vgu.backend.dto.request.FerryCreateRequest;
import org.vgu.backend.dto.request.FerryUpdateRequest;
import org.vgu.backend.dto.response.FerryResponse;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Ferry;
import org.vgu.backend.repository.FerryRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class FerryService implements IFerryService {

    private final FerryRepository ferryRepository;

    @Override
    public Page<FerryResponse> getAllFerries(Pageable pageable) {
        log.info("Getting all ferries with pagination: {}", pageable);
        Page<Ferry> ferries = ferryRepository.findAll(pageable);
        return ferries.map(this::convertToResponse);
    }

    @Override
    public FerryResponse getFerryById(Long id) {
        log.info("Getting ferry by ID: {}", id);
        Ferry ferry = ferryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Ferry not found with ID: " + id));
        return convertToResponse(ferry);
    }

    @Override
    public FerryResponse getFerryByCode(String ferryCode) {
        log.info("Getting ferry by code: {}", ferryCode);
        Ferry ferry = ferryRepository.findByFerryCode(ferryCode)
                .orElseThrow(() -> new DataNotFoundException("Ferry not found with code: " + ferryCode));
        return convertToResponse(ferry);
    }

    @Override
    public FerryResponse createFerry(FerryCreateRequest request) {
        log.info("Creating new ferry: {}", request);

        // Check if ferry code already exists
        if (ferryRepository.findByFerryCode(request.getFerryCode()).isPresent()) {
            throw new IllegalArgumentException("Ferry code already exists: " + request.getFerryCode());
        }

        Ferry ferry = Ferry.builder()
                .ferryName(request.getFerryName())
                .ferryCode(request.getFerryCode())
                .capacityVehicles(request.getCapacityVehicles())
                .capacityPassengers(request.getCapacityPassengers())
                .status(request.getStatus())
                .build();

        Ferry savedFerry = ferryRepository.save(ferry);
        log.info("Ferry created successfully with ID: {}", savedFerry.getId());
        return convertToResponse(savedFerry);
    }

    @Override
    public FerryResponse updateFerry(Long id, FerryUpdateRequest request) {
        log.info("Updating ferry with ID: {}", id);

        Ferry ferry = ferryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Ferry not found with ID: " + id));

        // Check if ferry code already exists (if changed)
        if (!ferry.getFerryCode().equals(request.getFerryCode())) {
            if (ferryRepository.findByFerryCode(request.getFerryCode()).isPresent()) {
                throw new IllegalArgumentException("Ferry code already exists: " + request.getFerryCode());
            }
        }

        ferry.setFerryName(request.getFerryName());
        ferry.setFerryCode(request.getFerryCode());
        ferry.setCapacityVehicles(request.getCapacityVehicles());
        ferry.setCapacityPassengers(request.getCapacityPassengers());
        if (request.getStatus() != null) {
            ferry.setStatus(request.getStatus());
        }

        Ferry updatedFerry = ferryRepository.save(ferry);
        log.info("Ferry updated successfully with ID: {}", updatedFerry.getId());
        return convertToResponse(updatedFerry);
    }

    @Override
    public void deleteFerry(Long id) {
        log.info("Deleting ferry with ID: {}", id);

        Ferry ferry = ferryRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Ferry not found with ID: " + id));

        ferryRepository.delete(ferry);
        log.info("Ferry deleted successfully with ID: {}", id);
    }

    @Override
    public FerryResponse convertToResponse(Ferry ferry) {
        return FerryResponse.builder()
                .id(ferry.getId())
                .ferryName(ferry.getFerryName())
                .ferryCode(ferry.getFerryCode())
                .capacityVehicles(ferry.getCapacityVehicles())
                .capacityPassengers(ferry.getCapacityPassengers())
                .status(ferry.getStatus())
                .createdAt(ferry.getCreatedAt())
                .build();
    }
}