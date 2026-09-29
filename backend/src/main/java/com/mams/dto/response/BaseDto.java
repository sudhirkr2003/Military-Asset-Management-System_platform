package com.mams.dto.response;

public class BaseDto {
    private Long id;
    private String name;
    private String code;
    private String location;
    private String commanderName;
    private String status;

    public BaseDto() {
    }

    public BaseDto(Long id, String name, String code, String location, String commanderName, String status) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.location = location;
        this.commanderName = commanderName;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
