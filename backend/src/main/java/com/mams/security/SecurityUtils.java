package com.mams.security;

import com.mams.entity.enums.RoleType;
import com.mams.security.services.UserDetailsImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    public UserDetailsImpl getCurrentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            return (UserDetailsImpl) auth.getPrincipal();
        }
        return null;
    }

    public RoleType getCurrentUserRole() {
        UserDetailsImpl user = getCurrentUserDetails();
        return user != null ? user.getRole() : null;
    }

    public Long getCurrentUserBaseId() {
        UserDetailsImpl user = getCurrentUserDetails();
        return user != null ? user.getBaseId() : null;
    }

    public boolean isCurrentUserAdmin() {
        RoleType role = getCurrentUserRole();
        return role == RoleType.ADMIN;
    }

    public boolean isCurrentUserBaseCommander() {
        RoleType role = getCurrentUserRole();
        return role == RoleType.BASE_COMMANDER;
    }

    public boolean isCurrentUserLogisticsOfficer() {
        RoleType role = getCurrentUserRole();
        return role == RoleType.LOGISTICS_OFFICER;
    }

    /**
     * Validates that if the current user is a BASE_COMMANDER, they are only accessing their assigned base.
     * If requestedBaseId is null or matches the user's baseId, returns the effective baseId.
     * If requestedBaseId does not match, throws AccessDeniedException.
     */
    public Long validateAndGetEffectiveBaseId(Long requestedBaseId) {
        UserDetailsImpl user = getCurrentUserDetails();
        if (user == null) {
            return requestedBaseId;
        }

        if (user.getRole() == RoleType.BASE_COMMANDER) {
            Long userBaseId = user.getBaseId();
            if (userBaseId == null) {
                throw new AccessDeniedException("Access Denied: Base Commander has no assigned military base.");
            }
            if (requestedBaseId != null && !requestedBaseId.equals(userBaseId)) {
                throw new AccessDeniedException("Access Denied: Base Commander can only access data for assigned Base ID: " + userBaseId);
            }
            return userBaseId;
        }

        return requestedBaseId;
    }

    /**
     * Enforces that the request's target baseId belongs to the current BASE_COMMANDER.
     */
    public void enforceBaseOwnership(Long targetBaseId) {
        UserDetailsImpl user = getCurrentUserDetails();
        if (user != null && user.getRole() == RoleType.BASE_COMMANDER) {
            Long userBaseId = user.getBaseId();
            if (userBaseId == null || !userBaseId.equals(targetBaseId)) {
                throw new AccessDeniedException("Access Denied: You can only perform transactions on your assigned Base (Base ID: " + userBaseId + ")");
            }
        }
    }
}
