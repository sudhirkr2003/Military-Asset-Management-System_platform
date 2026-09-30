package com.mams.security;

import com.mams.entity.enums.RoleType;
import com.mams.security.services.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class RbacSecurityTest {

    private SecurityUtils securityUtils;

    @BeforeEach
    void setUp() {
        securityUtils = new SecurityUtils();
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(Long id, String username, RoleType role, Long baseId) {
        UserDetailsImpl userDetails = new UserDetailsImpl(
                id,
                username,
                username + "@mams.mil",
                "Officer " + username,
                "hashedpassword",
                role,
                baseId,
                "Base " + baseId,
                "BASE-" + baseId,
                "ACTIVE",
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
        );

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("ADMIN role has full access and no base restrictions")
    void testAdmin_FullAccess() {
        authenticateUser(1L, "admin_user", RoleType.ADMIN, null);

        assertTrue(securityUtils.isCurrentUserAdmin());
        assertFalse(securityUtils.isCurrentUserBaseCommander());
        assertFalse(securityUtils.isCurrentUserLogisticsOfficer());

        // Admin accessing any baseId is allowed
        assertEquals(5L, securityUtils.validateAndGetEffectiveBaseId(5L));
        assertNull(securityUtils.validateAndGetEffectiveBaseId(null));
        assertDoesNotThrow(() -> securityUtils.enforceBaseOwnership(99L));
    }

    @Test
    @DisplayName("BASE_COMMANDER is restricted to their assigned base (Allowed for matching base)")
    void testBaseCommander_AllowedForAssignedBase() {
        authenticateUser(2L, "commander_alpha", RoleType.BASE_COMMANDER, 2L);

        assertFalse(securityUtils.isCurrentUserAdmin());
        assertTrue(securityUtils.isCurrentUserBaseCommander());
        assertFalse(securityUtils.isCurrentUserLogisticsOfficer());

        // Requesting their own base is allowed
        assertEquals(2L, securityUtils.validateAndGetEffectiveBaseId(2L));

        // Requesting with no baseId automatically resolves to their assigned base
        assertEquals(2L, securityUtils.validateAndGetEffectiveBaseId(null));

        assertDoesNotThrow(() -> securityUtils.enforceBaseOwnership(2L));
    }

    @Test
    @DisplayName("BASE_COMMANDER is denied (throws 403 AccessDeniedException) when accessing a different base")
    void testBaseCommander_DeniedForDifferentBase() {
        authenticateUser(2L, "commander_alpha", RoleType.BASE_COMMANDER, 2L);

        // Attempting to access Base 5 when assigned to Base 2
        AccessDeniedException ex1 = assertThrows(AccessDeniedException.class, () -> {
            securityUtils.validateAndGetEffectiveBaseId(5L);
        });
        assertTrue(ex1.getMessage().contains("Base Commander can only access data for assigned Base ID: 2"));

        // Attempting to execute transaction on Base 5
        AccessDeniedException ex2 = assertThrows(AccessDeniedException.class, () -> {
            securityUtils.enforceBaseOwnership(5L);
        });
        assertTrue(ex2.getMessage().contains("You can only perform transactions on your assigned Base"));
    }

    @Test
    @DisplayName("LOGISTICS_OFFICER has global logistics permissions")
    void testLogisticsOfficer_GlobalScope() {
        authenticateUser(3L, "logistics_officer", RoleType.LOGISTICS_OFFICER, 1L);

        assertFalse(securityUtils.isCurrentUserAdmin());
        assertFalse(securityUtils.isCurrentUserBaseCommander());
        assertTrue(securityUtils.isCurrentUserLogisticsOfficer());

        // Logistics officer can manage cross-base inventory & transfers
        assertEquals(5L, securityUtils.validateAndGetEffectiveBaseId(5L));
        assertNull(securityUtils.validateAndGetEffectiveBaseId(null));
        assertDoesNotThrow(() -> securityUtils.enforceBaseOwnership(5L));
    }
}
