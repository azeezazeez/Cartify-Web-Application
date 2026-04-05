package com.cartify.backend.controller;

import com.cartify.backend.dto.ApiResponse;
import com.cartify.backend.entity.CartItem;
import com.cartify.backend.entity.Product;
import com.cartify.backend.repository.CartRepository;
import com.cartify.backend.repository.ProductRepository;
import com.cartify.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin("*")
public class CartController {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCart(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
        }

        List<CartItem> cartItems = cartRepository.findByUserId(userId);

        List<Map<String, Object>> items = new ArrayList<>();
        double totalAmount = 0;
        int totalItems = 0;

        for (CartItem item : cartItems) {
            Optional<Product> productOpt = productRepository.findById(item.getProductId());
            if (productOpt.isPresent()) {
                Product product = productOpt.get();
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("cartItemId", item.getId());
                itemMap.put("userId", item.getUserId());
                itemMap.put("productId", item.getProductId());
                itemMap.put("productName", product.getName());
                itemMap.put("productPrice", product.getPrice());
                itemMap.put("productImage", product.getImage());
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("subtotal", product.getPrice() * item.getQuantity());

                items.add(itemMap);
                totalAmount += product.getPrice() * item.getQuantity();
                totalItems += item.getQuantity();
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("items", items);
        response.put("totalItems", totalItems);
        response.put("totalAmount", totalAmount);

        return ResponseEntity.ok(ApiResponse.success("Cart fetched", response));
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addToCart(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String productId = request.get("productId").toString();
        Integer quantity = Integer.valueOf(request.get("quantity").toString());

        if (!userRepository.existsById(userId)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found"));
        }

        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Product not found"));
        }

        Optional<CartItem> existingItem = cartRepository.findByUserIdAndProductId(userId, productId);

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + quantity);
            cartRepository.save(item);
        } else {
            CartItem newItem = new CartItem();
            newItem.setUserId(userId);
            newItem.setProductId(productId);
            newItem.setQuantity(quantity);
            cartRepository.save(newItem);
        }

        return getCart(userId);
    }

    @PutMapping("/update")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCartQuantity(@RequestBody Map<String, Object> request) {
        Long userId = Long.valueOf(request.get("userId").toString());
        String productId = request.get("productId").toString();
        Integer quantity = Integer.valueOf(request.get("quantity").toString());

        Optional<CartItem> existingItem = cartRepository.findByUserIdAndProductId(userId, productId);

        if (existingItem.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Item not found in cart"));
        }

        CartItem item = existingItem.get();
        item.setQuantity(quantity);
        cartRepository.save(item);

        return getCart(userId);
    }

    @DeleteMapping("/remove/{userId}/{productId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> removeFromCart(
            @PathVariable Long userId,
            @PathVariable String productId) {

        cartRepository.deleteByUserIdAndProductId(userId, productId);
        return getCart(userId);
    }

    @DeleteMapping("/clear/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> clearCart(@PathVariable Long userId) {
        cartRepository.deleteAllByUserId(userId);
        return getCart(userId);
    }
}