package com.mams.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ExpenditureRequest {

    @NotNull(message = "Base ID is required")
    private Long baseId;

    @NotNull(message = "Equipment Type ID is required")
    private Long equipmentTypeId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private long quantity;

    private String operationOrExercise;
    private String remarks;

    public ExpenditureRequest() {
    }

    public ExpenditureRequest(Long baseId, Long equipmentTypeId, long quantity, String operationOrExercise, String remarks) {
        this.baseId = baseId;
        this.equipmentTypeId = equipmentTypeId;
        this.quantity = quantity;
        this.operationOrExercise = operationOrExercise;
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

    public String getOperationOrExercise() {
        return operationOrExercise;
    }

    public void setOperationOrExercise(String operationOrExercise) {
        this.operationOrExercise = operationOrExercise;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
