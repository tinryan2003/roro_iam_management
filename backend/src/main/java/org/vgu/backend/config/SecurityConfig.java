package org.vgu.backend.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.CsrfConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.vgu.backend.exception.CustomAccessDeniedHandler;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

        private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

        @Value("${app.security.disable-auth:false}")
        private boolean disableAuth;

        @Bean
        SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
                JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
                jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(new KeycloakRoleConverter());

                http.sessionManagement(
                                sessionConfig -> sessionConfig.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .cors(corsConfig -> corsConfig.configurationSource(corsConfigurationSource()))
                                .csrf(CsrfConfigurer::disable)
                                .authorizeHttpRequests(requests -> {
                                        if (disableAuth) {
                                                logger.warn("Authentication is disabled - ALL requests will be permitted!");
                                                requests.anyRequest().permitAll();
                                        } else {
                                                requests
                                                                // Keycloak callback endpoints
                                                                .requestMatchers(
                                                                                "/api/auth/customer/callback/customer-portal")
                                                                .permitAll()
                                                                .requestMatchers(
                                                                                "/api/auth/employee/callback/employee-portal")
                                                                .permitAll()
                                                                // Keycloak events webhook
                                                                .requestMatchers("/keycloak/events").permitAll()

                                                                // Health and monitoring endpoints
                                                                .requestMatchers("/actuator/health", "/actuator/info")
                                                                .permitAll()

                                                                // Public capacity checking endpoints (for ferry booking
                                                                // demo)
                                                                .requestMatchers("/api/capacity/**")
                                                                .permitAll()

                                                                // Public booking endpoints (for demo)
                                                                .requestMatchers("/api/bookings/public/**")
                                                                .permitAll()

                                                                // Authentication endpoints
                                                                .requestMatchers("/api/auth/me").authenticated()
                                                                .requestMatchers("/api/auth/customer/profile")
                                                                .hasRole("CUSTOMER")
                                                                .requestMatchers("/api/auth/identity-provider/sync")
                                                                .authenticated()

                                                                // Admin endpoints
                                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                                .requestMatchers("/api/users/**").hasAnyRole("ADMIN")

                                                                // Customer endpoints
                                                                .requestMatchers("/api/customers/me",
                                                                                "/api/customers/me/**")
                                                                .hasRole("CUSTOMER")
                                                                .requestMatchers("/api/customers/**")
                                                                .hasAnyRole("ADMIN", "ACCOUNTANT", "PLANNER")

                                                                // Employee endpoints
                                                                .requestMatchers("/api/employees/**")
                                                                .hasAnyRole("ADMIN", "ACCOUNTANT", "PLANNER")

                                                                // Vehicle endpoints
                                                                .requestMatchers("/api/vehicles/**")
                                                                .hasAnyRole("ADMIN", "ACCOUNTANT", "OPERATION_MANAGER")

                                                                // Booking endpoints
                                                                .requestMatchers("/api/bookings/**")
                                                                .hasAnyRole("ADMIN", "ACCOUNTANT", "PLANNER",
                                                                                "CUSTOMER",
                                                                                "OPERATION_MANAGER")

                                                                // Sailing endpoints
                                                                .requestMatchers("/api/sailings/**")
                                                                .hasAnyRole("ADMIN", "PLANNER", "OPERATOR",
                                                                                "ACCOUNTANT", "CUSTOMER",
                                                                                "OPERATION_MANAGER")

                                                                // All other API endpoints require authentication
                                                                .requestMatchers("/api/**").authenticated()

                                                                // Allow other requests (like static resources)
                                                                .anyRequest().permitAll();
                                        }
                                })
                                .oauth2ResourceServer(oauth2 -> oauth2
                                                .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter)))
                                .exceptionHandling(ehc -> ehc.accessDeniedHandler(new CustomAccessDeniedHandler()));

                return http.build();
        }

        @Bean
        public JwtDecoder jwtDecoder(
                        @org.springframework.beans.factory.annotation.Value("${keycloak.employee.issuer}") String employeeIssuer,
                        @org.springframework.beans.factory.annotation.Value("${keycloak.customer.issuer}") String customerIssuer) {

                // Create decoders with explicit JWKS URI to avoid discovery issues
                String employeeJwksUri = employeeIssuer + "/protocol/openid-connect/certs";
                String customerJwksUri = customerIssuer + "/protocol/openid-connect/certs";

                // Use direct JWKS URI to avoid OIDC discovery issues
                try {
                        JwtDecoder employeeDecoder = JwtDecoders.fromOidcIssuerLocation(employeeIssuer);
                        JwtDecoder customerDecoder = JwtDecoders.fromOidcIssuerLocation(customerIssuer);

                        logger.info("Successfully created JWT decoders for employee issuer: {} and customer issuer: {}",
                                        employeeIssuer, customerIssuer);

                        return createDualRealmDecoder(employeeDecoder, customerDecoder, employeeIssuer, customerIssuer);
                } catch (Exception e) {
                        logger.warn("Failed to create decoders using OIDC discovery, falling back to direct JWKS: {}",
                                        e.getMessage());

                        // Fallback: Create decoders directly from JWKS URIs
                        JwtDecoder employeeDecoder = NimbusJwtDecoder
                                        .withJwkSetUri(employeeJwksUri).build();
                        JwtDecoder customerDecoder = NimbusJwtDecoder
                                        .withJwkSetUri(customerJwksUri).build();

                        return createDualRealmDecoder(employeeDecoder, customerDecoder, employeeIssuer, customerIssuer);
                }
        }

        private JwtDecoder createDualRealmDecoder(JwtDecoder employeeDecoder, JwtDecoder customerDecoder,
                        String employeeIssuer, String customerIssuer) {

                return token -> {
                        try {
                                // First check the issuer claim to determine which decoder to use
                                String[] chunks = token.split("\\.");
                                if (chunks.length >= 2) {
                                        String payload = new String(java.util.Base64.getUrlDecoder().decode(chunks[1]));
                                        if (payload.contains(employeeIssuer)) {
                                                logger.debug("Using employee decoder for token from issuer: {}",
                                                                employeeIssuer);
                                                return employeeDecoder.decode(token);
                                        } else if (payload.contains(customerIssuer)) {
                                                logger.debug("Using customer decoder for token from issuer: {}",
                                                                customerIssuer);
                                                return customerDecoder.decode(token);
                                        }
                                }

                                // Fallback: try employee decoder first
                                logger.debug("No issuer match found, trying employee decoder first");
                                return employeeDecoder.decode(token);
                        } catch (Exception ex) {
                                try {
                                        // Try the customer realm next
                                        logger.debug("Employee decoder failed, trying customer decoder");
                                        return customerDecoder.decode(token);
                                } catch (Exception ex2) {
                                        // Log both exceptions for debugging
                                        logger.error("Failed to decode JWT with employee decoder: {}", ex.getMessage());
                                        logger.error("Failed to decode JWT with customer decoder: {}",
                                                        ex2.getMessage());
                                        logger.error("JWT token (first 50 chars): {}",
                                                        token.length() > 50 ? token.substring(0, 50) + "..." : token);
                                        throw ex2;
                                }
                        }
                };
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOrigins(List.of("http://localhost:3000"));
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
                config.setAllowCredentials(true);
                config.setAllowedHeaders(List.of("*"));
                config.setExposedHeaders(List.of("Authorization", "X-XSRF-TOKEN"));
                config.setMaxAge(3600L);
                return request -> config;
        }
}