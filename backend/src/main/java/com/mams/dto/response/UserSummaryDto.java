package com.mams.dto.response;

import com.mams.entity.enums.RoleType;

public class UserSummaryDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private RoleType role;
    private Long baseId;
    private String baseName;
    private String baseCode;
    private String status;

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String username, String email, String fullName,
                          RoleType role, Long baseId, String baseName, String baseCode, String status) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.baseId = baseId;
        this.baseName = baseName;
        this.baseCode = baseCode;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public RoleType getRole() {
        return role;
    }

    public void setRole(RoleType role) {
        this.role = role;
    }

    public Long getBaseId() {
        return baseId;
    }

    public void setBaseId(Long baseId) {
        this.baseId = baseId;
    }

    public String getBaseName() {
        return baseName;
    }

    public void setBaseName(String baseName) {
        this.baseName = baseName;
    }

    public String getBaseCode() {
        return baseCode;
    }

    public void setBaseCode(String baseCode) {
        this.baseCode = baseCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
