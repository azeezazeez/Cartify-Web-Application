package com.cartify.backend.repository;

import com.cartify.backend.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface CartRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserId(Long userId);
    Optional<CartItem> findByUserIdAndProductId(Long userId, String productId);
    boolean existsByUserIdAndProductId(Long userId, String productId);

    @Modifying
    @Transactional
    @Query("DELETE FROM CartItem c WHERE c.userId = :userId AND c.productId = :productId")
    void deleteByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") String productId);

    @Modifying
    @Transactional
    void deleteAllByUserId(Long userId);
}