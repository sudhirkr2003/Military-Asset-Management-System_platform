package com.mams.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class PurchaseRequest {

    @NotNull(message = "Base ID is required")
    private Long baseId;

    @NotNull(message = "Equipment Type ID is required")
    private Long equipmentTypeId;

    @Min(value = 1, message = "Quantity must be at least 1")
    private long quantity;

    private String supplier;
    private String invoiceNumber;
    private String remarks;

    public PurchaseRequest() {
    }

    public PurchaseRequest(Long baseId, Long equipmentTypeId, long quantity, String supplier, String invoiceNumber, String remarks) {
        this.baseId = baseId;
        this.equipmentTypeId = equipmentTypeId;
        this.quantity = quantity;
        this.supplier = supplier;
        this.invoiceNumber = invoiceNumber;
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

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public String getInvoiceNumber() {
        return invoiceNumber;
    }

    public void setInvoiceNumber(String invoiceNumber) {
        this.invoiceNumber = invoiceNumber;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
