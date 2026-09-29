package com.mams.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ReturnAssignmentRequest {

    @NotNull(message = "Base ID is required")
    private Long baseId;

    @NotNull(message = "Equipment Type ID is required")
    private Long equipmentTypeId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private long quantity;

    private Long personnelId;
    private String serviceNumber;
    private String remarks;

    public ReturnAssignmentRequest() {
    }

    public ReturnAssignmentRequest(Long baseId, Long equipmentTypeId, long quantity, Long personnelId, String serviceNumber, String remarks) {
        this.baseId = baseId;
        this.equipmentTypeId = equipmentTypeId;
        this.quantity = quantity;
        this.personnelId = personnelId;
        this.serviceNumber = serviceNumber;
        this.remarks = remarks;
    }

    public Long getBaseId() {
        return baseId;
    }

    public void setBaseId(Long baseId) {
        this.baseId = baseId;
    }

    public Long getEquipmentTypeId() {
        return equipmentTypeId;
    }

    public void setEquipmentTypeId(Long equipmentTypeId) {
        this.equipmentTypeId = equipmentTypeId;
    }

    public long getQuantity() {
        return quantity;
    }

    public void setQuantity(long quantity) {
        this.quantity = quantity;
    }

    public Long getPersonnelId() {
        return personnelId;
    }

    public void setPersonnelId(Long personnelId) {
        this.personnelId = personnelId;
    }

    public String getServiceNumber() {
        return serviceNumber;
    }

    public void setServiceNumber(String serviceNumber) {
        this.serviceNumber = serviceNumber;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
