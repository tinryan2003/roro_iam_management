package org.vgu.backend.service.ferry;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.vgu.backend.dto.request.FerryCreateRequest;
import org.vgu.backend.dto.request.FerryUpdateRequest;
import org.vgu.backend.dto.response.FerryResponse;
import org.vgu.backend.model.Ferry;

public interface IFerryService {

    Page<FerryResponse> getAllFerries(Pageable pageable);

    FerryResponse getFerryById(Long id);

    FerryResponse getFerryByCode(String ferryCode);

    FerryResponse createFerry(FerryCreateRequest request);

    FerryResponse updateFerry(Long id, FerryUpdateRequest request);

    void deleteFerry(Long id);

    FerryResponse convertToResponse(Ferry ferry);
}