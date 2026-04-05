package com.cartify.backend.controller;


import com.cartify.backend.dto.*;
import com.cartify.backend.entity.*;
import com.cartify.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    // Helper method to convert Order to OrderResponse
    private OrderResponse convertToOrderResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProductId(),
                        item.getProductName(),
                        item.getPrice(),
                        item.getQuantity(),
                        item.getSubtotal()
                ))
                .collect(Collectors.toList());

        return new OrderResponse(
                order.getOrderId(),
                order.getOrderDate(),
                order.getTotalAmount(),
                order.getStatus(),
                itemResponses
        );
    }

    // 1️⃣6️⃣ Place Order
    @PostMapping("/place/{userId}")
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @PathVariable Long userId,
            @RequestBody(required = false) PlaceOrderRequest request) {

        // Check if user exists
        if (!userRepository.existsById(userId)) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found with ID: " + userId));
        }

        // Get user's cart items
        List<CartItem> cartItems = cartRepository.findByUserId(userId);

        if (cartItems.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Cannot place order with empty cart"));
        }

        // Create new order
        Order order = new Order();
        order.setUserId(userId);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);

        // Calculate total and create order items
        Double totalAmount = 0.0;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            // Get product details
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItem.getProductId()));

            // Check stock
            if (!product.getInStock()) {
                return ResponseEntity
                        .status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Product " + product.getName() + " is out of stock"));
            }

            // Create order item
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(product.getId());
            orderItem.setProductName(product.getName());
            orderItem.setPrice(product.getPrice());
            orderItem.setQuantity(cartItem.getQuantity());

            Double subtotal = product.getPrice() * cartItem.getQuantity();
            orderItem.setSubtotal(subtotal);

            orderItems.add(orderItem);
            totalAmount += subtotal;
        }

        order.setTotalAmount(totalAmount);
        order.setItems(orderItems);

        // Save order (this will cascade save order items)
        Order savedOrder = orderRepository.save(order);

        // Clear user's cart after successful order placement
        cartRepository.deleteAllByUserId(userId);

        // Update product stock (optional)
        for (CartItem cartItem : cartItems) {
            Product product = productRepository.findById(cartItem.getProductId()).orElse(null);
            if (product != null) {
                // You might want to decrease stock quantity here
                // product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
                // productRepository.save(product);
            }
        }

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order placed successfully", convertToOrderResponse(savedOrder)));
    }

    // 1️⃣7️⃣ Order History
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrderHistory(@PathVariable Long userId) {

        // Check if user exists
        if (!userRepository.existsById(userId)) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found with ID: " + userId));
        }

        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);

        List<OrderResponse> response = orders.stream()
                .map(this::convertToOrderResponse)
                .collect(Collectors.toList());

        return ResponseEntity
                .ok(ApiResponse.success("Order history fetched successfully", response));
    }

    // Additional endpoint: Get order details by order ID
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByOrderId(@PathVariable String orderId) {

        Order order = orderRepository.findByOrderId(orderId)
                .orElse(null);

        if (order == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Order not found with ID: " + orderId));
        }

        return ResponseEntity
                .ok(ApiResponse.success("Order fetched successfully", convertToOrderResponse(order)));
    }

    // Additional endpoint: Get order summary for user
    @GetMapping("/user/{userId}/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderSummary(@PathVariable Long userId) {

        if (!userRepository.existsById(userId)) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("User not found with ID: " + userId));
        }

        Integer orderCount = orderRepository.getOrderCountByUserId(userId);
        Double totalSpent = orderRepository.getTotalSpentByUserId(userId);
        List<Order> recentOrders = orderRepository.findByUserIdOrderByOrderDateDesc(userId)
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        List<OrderHistoryResponse> recentOrderSummaries = recentOrders.stream()
                .map(order -> new OrderHistoryResponse(
                        order.getOrderId(),
                        order.getOrderDate(),
                        order.getTotalAmount(),
                        order.getStatus(),
                        order.getItems().size()
                ))
                .collect(Collectors.toList());

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalOrders", orderCount);
        summary.put("totalSpent", totalSpent);
        summary.put("recentOrders", recentOrderSummaries);

        return ResponseEntity
                .ok(ApiResponse.success("Order summary fetched successfully", summary));
    }

    // Additional endpoint: Cancel order
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable String orderId) {

        Order order = orderRepository.findByOrderId(orderId)
                .orElse(null);

        if (order == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Order not found with ID: " + orderId));
        }

        // Can only cancel pending orders
        if (order.getStatus() != OrderStatus.PENDING) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Only pending orders can be cancelled"));
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order cancelledOrder = orderRepository.save(order);

        return ResponseEntity
                .ok(ApiResponse.success("Order cancelled successfully", convertToOrderResponse(cancelledOrder)));
    }
}