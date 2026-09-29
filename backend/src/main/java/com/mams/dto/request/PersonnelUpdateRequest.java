package com.mams.dto.request;

import com.mams.entity.enums.RoleType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class PersonnelUpdateRequest {

    @NotBlank(message = "Full Name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    private String email;

    @NotNull(message = "Military Role is required")
    private RoleType role;

    private Long baseId;

    @Size(max = 30, message = "Status cannot exceed 30 characters")
    private String status = "ACTIVE";

    private String password;

    public PersonnelUpdateRequest() {
    }

    public PersonnelUpdateRequest(String fullName, String email, RoleType role, Long baseId, String status, String password) {
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.baseId = baseId;
        this.status = status != null ? status : "ACTIVE";
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
