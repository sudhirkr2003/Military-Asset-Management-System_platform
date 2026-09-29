package com.mams.service;

import com.mams.dto.request.*;
import com.mams.dto.response.MovementLedgerDto;

import java.time.LocalDateTime;
import java.util.List;

public interface MovementService {

    MovementLedgerDto recordPurchase(PurchaseRequest request, String currentUser);

    MovementLedgerDto recordTransfer(TransferRequest request, String currentUser);

    MovementLedgerDto recordAssignment(AssignmentRequest request, String currentUser);

    MovementLedgerDto recordReturn(ReturnAssignmentRequest request, String currentUser);

    MovementLedgerDto recordExpenditure(ExpenditureRequest request, String currentUser);

    List<MovementLedgerDto> getMovements(Long baseId, Long equipmentTypeId, LocalDateTime startDate, LocalDateTime endDate);

    MovementLedgerDto getMovementById(Long id);
}
