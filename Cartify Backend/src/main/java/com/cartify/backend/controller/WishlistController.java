package com.cartify.backend.controller;

import com.cartify.backend.dto.ApiResponse;
import com.cartify.backend.entity.Product;
import com.cartify.backend.entity.WishlistItem;
import com.cartify.backend.repository.ProductRepository;
import com.cartify.backend.repository.UserRepository;
import com.cartify.backend.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin("*")
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWishlist(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
        }

        List<WishlistItem> wishlistItems = wishlistRepository.findByUserId(userId);

        List<Map<String, Object>> items = new ArrayList<>();

        for (WishlistItem item : wishlistItems) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isPresent()) {
                Product product = productOpt.get();
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("wishlistItemId", item.getId());
                itemMap.put("userId", item.getUserId());
                itemMap.put("productId", item.getProductId());
                itemMap.put("productName", product.getName());
                itemMap.put("productPrice", product.getPrice());
                itemMap.put("productImage", product.getImage());
                itemMap.put("productDescription", product.getDescription());
                itemMap.put("category", product.getCategory());
                itemMap.put("rating", product.getRating());
                itemMap.put("reviews", product.getReviews());
                itemMap.put("inStock", product.getInStock());
                itemMap.put("addedAt", item.getAddedAt());

                items.add(itemMap);
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("items", items);
        response.put("totalItems", items.size());

        return ResponseEntity.ok(ApiResponse.success("Wishlist fetched", response));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addToWishlist(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String productId = request.get("productId").toString();

        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
        }

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Product not found"));
        }

        Optional<WishlistItem> existingItem = wishlistRepository.findByUserIdAndProductId(userId, productId);
        if (existingItem.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error("Product already in wishlist"));
        }

        WishlistItem newItem = new WishlistItem();
        newItem.setUserId(userId);
        newItem.setProductId(productId);
        newItem.setAddedAt(LocalDateTime.now());
        wishlistRepository.save(newItem);

        return getWishlist(userId);
    }

    @DeleteMapping("/remove/{userId}/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeFromWishlist(
            @PathVariable Long userId,
            @PathVariable String productId) {

        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        return getWishlist(userId);
    }

    @GetMapping("/{userId}/check/{productId}")
    public ResponseEntity<ApiResponse<Boolean>> checkInWishlist(
            @PathVariable Long userId,
            @PathVariable String productId) {

        boolean exists = wishlistRepository.existsByUserIdAndProductId(userId, productId);
        return ResponseEntity.ok(ApiResponse.success("Check completed", exists));
    }
}