package com.mams.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class TransferRequest {

    @NotNull(message = "Source Base ID (fromBaseId) is required")
    private Long fromBaseId;

    @NotNull(message = "Destination Base ID (toBaseId) is required")
    private Long toBaseId;

    @NotNull(message = "Equipment Type ID is required")
    private Long equipmentTypeId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private long quantity;

    private String reason;
    private String remarks;

    public TransferRequest() {
    }

    public TransferRequest(Long fromBaseId, Long toBaseId, Long equipmentTypeId, long quantity, String reason, String remarks) {
        this.fromBaseId = fromBaseId;
        this.toBaseId = toBaseId;
        this.equipmentTypeId = equipmentTypeId;
        this.quantity = quantity;
        this.reason = reason;
        this.remarks = remarks;
    }

    public Long getFromBaseId() {
        return fromBaseId;
    }

    public void setFromBaseId(Long fromBaseId) {
        this.fromBaseId = fromBaseId;
    }

    public Long getToBaseId() {
        return toBaseId;
    }

    public void setToBaseId(Long toBaseId) {
        this.toBaseId = toBaseId;
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

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
