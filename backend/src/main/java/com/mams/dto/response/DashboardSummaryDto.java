package com.mams.dto.response;

public class DashboardSummaryDto {
    private long openingBalance;
    private long purchases;
    private long transferIn;
    private long transferOut;
    private long netMovement;
    private long assigned;
    private long expended;
    private long closingBalance;

    public DashboardSummaryDto() {
    }

    public DashboardSummaryDto(long openingBalance, long purchases, long transferIn, long transferOut,
                               long netMovement, long assigned, long expended, long closingBalance) {
        this.openingBalance = openingBalance;
        this.purchases = purchases;
        this.transferIn = transferIn;
        this.transferOut = transferOut;
        this.netMovement = netMovement;
        this.assigned = assigned;
        this.expended = expended;
        this.closingBalance = closingBalance;
    }

    public long getOpeningBalance() {
        return openingBalance;
    }

    public void setOpeningBalance(long openingBalance) {
        this.openingBalance = openingBalance;
    }

    public long getPurchases() {
        return purchases;
    }

    public void setPurchases(long purchases) {
        this.purchases = purchases;
    }

    public long getTransferIn() {
        return transferIn;
    }

    public void setTransferIn(long transferIn) {
        this.transferIn = transferIn;
    }

    public long getTransferOut() {
        return transferOut;
    }

    public void setTransferOut(long transferOut) {
        this.transferOut = transferOut;
    }

    public long getNetMovement() {
        return netMovement;
    }

    public void setNetMovement(long netMovement) {
        this.netMovement = netMovement;
    }

    public long getAssigned() {
        return assigned;
    }

    public void setAssigned(long assigned) {
        this.assigned = assigned;
    }

    public long getExpended() {
        return expended;
    }

    public void setExpended(long expended) {
        this.expended = expended;
    }

    public long getClosingBalance() {
        return closingBalance;
    }

    public void setClosingBalance(long closingBalance) {
        this.closingBalance = closingBalance;
    }
}
