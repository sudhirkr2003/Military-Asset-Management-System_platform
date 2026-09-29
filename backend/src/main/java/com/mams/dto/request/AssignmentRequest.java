package com.mams.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AssignmentRequest {

    @NotNull(message = "Base ID is required")
    private Long baseId;

    @NotNull(message = "Equipment Type ID is required")
    private Long equipmentTypeId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private long quantity;

    private Long personnelId;
    private String personnelName;
    private String serviceNumber;
    private String purpose;
    private String remarks;

    public AssignmentRequest() {
    }

    public AssignmentRequest(Long baseId, Long equipmentTypeId, long quantity, Long personnelId,
                             String personnelName, String serviceNumber, String purpose, String remarks) {
        this.baseId = baseId;
        this.equipmentTypeId = equipmentTypeId;
        this.quantity = quantity;
        this.personnelId = personnelId;
        this.personnelName = personnelName;
        this.serviceNumber = serviceNumber;
        this.purpose = purpose;
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

    public String getPersonnelName() {
        return personnelName;
    }

    public void setPersonnelName(String personnelName) {
        this.personnelName = personnelName;
    }

    public String getServiceNumber() {
        return serviceNumber;
    }

    public void setServiceNumber(String serviceNumber) {
        this.serviceNumber = serviceNumber;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
