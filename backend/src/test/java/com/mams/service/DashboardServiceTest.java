package com.mams.service;

import com.mams.dto.response.DashboardSummaryDto;
import com.mams.entity.enums.MovementType;
import com.mams.repository.InventoryRepository;
import com.mams.repository.MovementLedgerRepository;
import com.mams.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class DashboardServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private MovementLedgerRepository movementLedgerRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    @DisplayName("Should accurately calculate Opening, Net Movement (Purchases + Transfer In - Transfer Out), and Closing Balance")
    void testGetSummary_AccurateMathematicalCalculations() {
        // Mock inventory counts
        when(inventoryRepository.sumOpeningBalance(null, null)).thenReturn(1000L);
        when(inventoryRepository.sumAvailableQuantity(null, null)).thenReturn(900L);
        when(inventoryRepository.sumAssignedQuantity(null, null)).thenReturn(250L);
        when(inventoryRepository.sumExpendedQuantity(null, null)).thenReturn(50L);
        when(inventoryRepository.sumClosingBalance(null, null)).thenReturn(1200L);

        // Mock movement counts
        when(movementLedgerRepository.sumQuantityByMovementTypeAndFilters(
                eq(MovementType.PURCHASE), any(), any(), any(), any()))
                .thenReturn(300L);

        when(movementLedgerRepository.sumQuantityByMovementTypeAndFilters(
                eq(MovementType.TRANSFER_IN), any(), any(), any(), any()))
                .thenReturn(100L);

        when(movementLedgerRepository.sumQuantityByMovementTypeAndFilters(
                eq(MovementType.TRANSFER_OUT), any(), any(), any(), any()))
                .thenReturn(150L);

        DashboardSummaryDto summary = dashboardService.getSummary(null, null, "ALL");

        assertNotNull(summary);
        assertEquals(1000L, summary.getOpeningBalance());
        assertEquals(300L, summary.getPurchases());
        assertEquals(100L, summary.getTransferIn());
        assertEquals(150L, summary.getTransferOut());
        // Net Movement = Purchases (300) + Transfer In (100) - Transfer Out (150) = 250
        assertEquals(250L, summary.getNetMovement());
        assertEquals(250L, summary.getAssigned());
        assertEquals(50L, summary.getExpended());
        assertEquals(1200L, summary.getClosingBalance());
    }
}
