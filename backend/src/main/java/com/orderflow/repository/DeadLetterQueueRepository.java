package com.orderflow.repository;

import com.orderflow.entity.DeadLetterQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeadLetterQueueRepository extends JpaRepository<DeadLetterQueue, Long> {

    Optional<DeadLetterQueue> findByOrderNumber(String orderNumber);

    List<DeadLetterQueue> findAllByOrderByFailedAtDesc();
}
