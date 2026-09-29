package com.mams.security.services;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mams.entity.User;
import com.mams.entity.enums.RoleType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

public class UserDetailsImpl implements UserDetails {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String username;
    private String email;
    private String fullName;

    @JsonIgnore
    private String password;

    private RoleType role;
    private Long baseId;
    private String baseName;
    private String baseCode;
    private String status;

    private Collection<? extends GrantedAuthority> authorities;

    public UserDetailsImpl(Long id, String username, String email, String fullName,
                           String password, RoleType role, Long baseId, String baseName,
                           String baseCode, String status,
                           Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.password = password;
        this.role = role;
        this.baseId = baseId;
        this.baseName = baseName;
        this.baseCode = baseCode;
        this.status = status;
        this.authorities = authorities;
    }

    public static UserDetailsImpl build(User user) {
        List<GrantedAuthority> authorities = List.of(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        Long baseId = user.getBase() != null ? user.getBase().getId() : null;
        String baseName = user.getBase() != null ? user.getBase().getName() : null;
        String baseCode = user.getBase() != null ? user.getBase().getCode() : null;

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getPassword(),
                user.getRole(),
                baseId,
                baseName,
                baseCode,
                user.getStatus(),
                authorities);
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getFullName() {
        return fullName;
    }

    public RoleType getRole() {
        return role;
    }

    public Long getBaseId() {
        return baseId;
    }

    public String getBaseName() {
        return baseName;
    }

    public String getBaseCode() {
        return baseCode;
    }

    public String getStatus() {
        return status;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"LOCKED".equalsIgnoreCase(status);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(status);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserDetailsImpl that = (UserDetailsImpl) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
