package com.orderflow.repository;

import com.orderflow.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductId(Long productId);

    /**
     * Executes atomic conditional inventory reduction at database engine level.
     * Returns 1 if stock was reserved successfully, 0 if insufficient stock was available.
     */
    @Modifying
    @Query("UPDATE Inventory i SET i.availableQuantity = i.availableQuantity - :quantity, i.updatedAt = CURRENT_TIMESTAMP " +
           "WHERE i.productId = :productId AND i.availableQuantity >= :quantity")
    int decrementAvailableStock(@Param("productId") Long productId, @Param("quantity") int quantity);

    @Query("SELECT COALESCE(MIN(i.availableQuantity), 0) FROM Inventory i")
    int getMinimumAvailableQuantity();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.availableQuantity < 0")
    long countNegativeStockRecords();

    @Modifying
    @Query("UPDATE Inventory i SET i.availableQuantity = :quantity, i.reservedQuantity = 0, i.updatedAt = CURRENT_TIMESTAMP WHERE i.productId = :productId")
    int setStock(@Param("productId") Long productId, @Param("quantity") int quantity);
}

