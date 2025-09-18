package org.vgu.backend.service.route;

import org.vgu.backend.dto.request.RouteCreateRequest;
import org.vgu.backend.model.Route;

public interface IRouteService {
    Route createRoute(RouteCreateRequest request) throws Exception;

    Route getRouteById(String routeId);

    void deleteRouteById(String routeId);

    boolean existsRouteById(String routeId);
}
