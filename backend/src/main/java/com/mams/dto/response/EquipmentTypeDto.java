package com.mams.dto.response;

import com.mams.entity.enums.EquipmentCategory;

public class EquipmentTypeDto {
    private Long id;
    private String name;
    private String code;
    private EquipmentCategory category;
    private String unit;
    private boolean isConsumable;
    private String description;
    private String status;

    public EquipmentTypeDto() {
    }

    public EquipmentTypeDto(Long id, String name, String code, EquipmentCategory category,
                            String unit, boolean isConsumable, String description, String status) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.category = category;
        this.unit = unit;
        this.isConsumable = isConsumable;
        this.description = description;
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

    public EquipmentCategory getCategory() {
        return category;
    }

    public void setCategory(EquipmentCategory category) {
        this.category = category;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public boolean isConsumable() {
        return isConsumable;
    }

    public void setConsumable(boolean consumable) {
        isConsumable = consumable;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
