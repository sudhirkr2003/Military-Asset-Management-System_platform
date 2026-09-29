package com.mams.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class BaseCreateRequest {

    @NotBlank(message = "Base installation name is required")
    @Size(max = 100, message = "Base name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Base tactical code is required")
    @Size(max = 20, message = "Base code cannot exceed 20 characters")
    private String code;

    @Size(max = 150, message = "Location cannot exceed 150 characters")
    private String location;

    @Size(max = 100, message = "Commander name cannot exceed 100 characters")
    private String commanderName;

    public BaseCreateRequest() {
    }

    public BaseCreateRequest(String name, String code, String location, String commanderName) {
        this.name = name;
        this.code = code;
        this.location = location;
        this.commanderName = commanderName;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCommanderName() {
        return commanderName;
    }

    public void setCommanderName(String commanderName) {
        this.commanderName = commanderName;
    }
}
