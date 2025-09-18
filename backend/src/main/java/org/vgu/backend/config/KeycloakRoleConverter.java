package org.vgu.backend.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

@Component
public class KeycloakRoleConverter implements Converter<Jwt, Collection<GrantedAuthority>> {

    @Override
    public Collection<GrantedAuthority> convert(Jwt jwt) {
        List<GrantedAuthority> authorities = new ArrayList<>();

        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess instanceof Map<?, ?> ra && ra.get("roles") instanceof List<?> roles) {
            for (Object r : roles) {
                String roleName = String.valueOf(r).toUpperCase();
                authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
            }
        }

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess instanceof Map<?, ?> resources) {
            for (Object clientObj : resources.values()) {
                if (clientObj instanceof Map<?, ?> co && co.get("roles") instanceof List<?> cRoles) {
                    for (Object r : cRoles) {
                        String roleName = String.valueOf(r).toUpperCase();
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
                    }
                }
            }
        }

        return authorities;
    }
}