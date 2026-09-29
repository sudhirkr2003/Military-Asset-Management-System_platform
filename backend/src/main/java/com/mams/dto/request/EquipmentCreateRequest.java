package com.mams.dto.request;

import com.mams.entity.enums.EquipmentCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class EquipmentCreateRequest {

    @NotBlank(message = "Equipment name is required")
    @Size(max = 100, message = "Equipment name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Equipment code/identifier is required")
    @Size(max = 30, message = "Equipment code cannot exceed 30 characters")
    private String code;

    @NotNull(message = "Category is required")
    private EquipmentCategory category;

    @Size(max = 30, message = "Unit of measure cannot exceed 30 characters")
    private String unit = "units";

    private boolean isConsumable = false;

    @Size(max = 255, message = "Description cannot exceed 255 characters")
    private String description;

    public EquipmentCreateRequest() {
    }

    public EquipmentCreateRequest(String name, String code, EquipmentCategory category, String unit, boolean isConsumable, String description) {
        this.name = name;
        this.code = code;
        this.category = category;
        this.unit = unit != null ? unit : "units";
        this.isConsumable = isConsumable;
        this.description = description;
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
}
