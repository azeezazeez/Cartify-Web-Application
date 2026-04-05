package com.cartify.backend.repository;

import com.cartify.backend.entity.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserId(Long userId);
    Optional<WishlistItem> findByUserIdAndProductId(Long userId, String productId);
    boolean existsByUserIdAndProductId(Long userId, String productId);

    @Modifying
    @Transactional
    @Query("DELETE FROM WishlistItem w WHERE w.userId = :userId AND w.productId = :productId")
    void deleteByUserIdAndProductId(@Param("userId") Long userId, @Param("productId") String productId);
}