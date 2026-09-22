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
}
