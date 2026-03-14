package com.auxera.backend.controller;

import com.auxera.backend.dto.ApiResponse;
import com.auxera.backend.dto.admin.AdminOrderDTO;
import com.auxera.backend.entity.Order;
import com.auxera.backend.entity.OrderStatus;
import com.auxera.backend.entity.User;
import com.auxera.backend.repository.OrderRepository;
import com.auxera.backend.repository.ProductRepository;
import com.auxera.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    // 1️⃣ Get all orders (for admin dashboard)
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<AdminOrderDTO>>> getAllOrders() {
        try {
            List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();

            List<AdminOrderDTO> orderDTOs = orders.stream()
                    .map(order -> AdminOrderDTO.fromOrder(order, userRepository))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(
                    ApiResponse.success("Orders fetched successfully", orderDTOs)
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch orders: " + e.getMessage()));
        }
    }

    // 2️⃣ Get single order by ID
    @GetMapping("/orders/{orderId}")
    public ResponseEntity<ApiResponse<AdminOrderDTO>> getOrderById(@PathVariable String orderId) {
        try {
            Order order = orderRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            return ResponseEntity.ok(
                    ApiResponse.success("Order fetched successfully",
                            AdminOrderDTO.fromOrder(order, userRepository))
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // 3️⃣ Update order status (CONFIRM, SHIP, DELIVER, CANCEL)
    @PutMapping("/orders/{orderId}/status")
    public ResponseEntity<ApiResponse<AdminOrderDTO>> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody UpdateStatusRequest request) {
        try {
            Order order = orderRepository.findByOrderId(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            order.setStatus(request.getStatus());
            Order updatedOrder = orderRepository.save(order);

            return ResponseEntity.ok(
                    ApiResponse.success("Order status updated to " + request.getStatus(),
                            AdminOrderDTO.fromOrder(updatedOrder, userRepository))
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // 4️⃣ Get orders by status
    @GetMapping("/orders/status/{status}")
    public ResponseEntity<ApiResponse<List<AdminOrderDTO>>> getOrdersByStatus(
            @PathVariable OrderStatus status) {
        try {
            List<Order> orders = orderRepository.findByStatusOrderByOrderDateDesc(status);

            List<AdminOrderDTO> orderDTOs = orders.stream()
                    .map(order -> AdminOrderDTO.fromOrder(order, userRepository))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(
                    ApiResponse.success("Orders fetched successfully", orderDTOs)
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch orders: " + e.getMessage()));
        }
    }

    // 5️⃣ Get order statistics
    @GetMapping("/orders/stats")
    public ResponseEntity<ApiResponse<OrderStatsDTO>> getOrderStats() {
        try {
            List<Order> allOrders = orderRepository.findAll();

            OrderStatsDTO stats = new OrderStatsDTO();
            stats.setTotalOrders(allOrders.size());
            stats.setTotalRevenue(allOrders.stream()
                    .mapToDouble(Order::getTotalAmount)
                    .sum());
            stats.setPendingOrders(allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.PENDING)
                    .count());
            stats.setConfirmedOrders(allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.CONFIRMED)
                    .count());
            stats.setProcessingOrders(allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.PROCESSING)
                    .count());
            stats.setShippedOrders(allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.SHIPPED)
                    .count());
            stats.setDeliveredOrders(allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                    .count());
            stats.setCancelledOrders(allOrders.stream()
                    .filter(o -> o.getStatus() == OrderStatus.CANCELLED)
                    .count());

            // Get recent orders (last 5)
            List<AdminOrderDTO> recentOrders = allOrders.stream()
                    .limit(5)
                    .map(order -> AdminOrderDTO.fromOrder(order, userRepository))
                    .collect(Collectors.toList());
            stats.setRecentOrders(recentOrders);

            return ResponseEntity.ok(
                    ApiResponse.success("Stats fetched successfully", stats)
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch stats: " + e.getMessage()));
        }
    }

    // 6️⃣ Get all customers
    @GetMapping("/customers")
    public ResponseEntity<ApiResponse<List<AdminCustomerDTO>>> getAllCustomers() {
        try {
            List<User> users = userRepository.findAll();

            List<AdminCustomerDTO> customerDTOs = users.stream()
                    .map(AdminCustomerDTO::fromUser)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(
                    ApiResponse.success("Customers fetched successfully", customerDTOs)
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch customers: " + e.getMessage()));
        }
    }

    // 7️⃣ Get customer by ID
    @GetMapping("/customers/{customerId}")
    public ResponseEntity<ApiResponse<AdminCustomerDTO>> getCustomerById(@PathVariable Long customerId) {
        try {
            User user = userRepository.findById(customerId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"));

            return ResponseEntity.ok(
                    ApiResponse.success("Customer fetched successfully", AdminCustomerDTO.fromUser(user))
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    // 8️⃣ Get customer orders
    @GetMapping("/customers/{customerId}/orders")
    public ResponseEntity<ApiResponse<List<AdminOrderDTO>>> getCustomerOrders(@PathVariable Long customerId) {
        try {
            List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(customerId);

            List<AdminOrderDTO> orderDTOs = orders.stream()
                    .map(order -> AdminOrderDTO.fromOrder(order, userRepository))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(
                    ApiResponse.success("Customer orders fetched successfully", orderDTOs)
            );
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to fetch customer orders: " + e.getMessage()));
        }
    }
}

// DTOs
class UpdateStatusRequest {
    private OrderStatus status;

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
}

class OrderStatsDTO {
    private long totalOrders;
    private double totalRevenue;
    private long pendingOrders;
    private long confirmedOrders;
    private long processingOrders;
    private long shippedOrders;
    private long deliveredOrders;
    private long cancelledOrders;
    private List<AdminOrderDTO> recentOrders;

    // Getters and setters
    public long getTotalOrders() { return totalOrders; }
    public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

    public double getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(double totalRevenue) { this.totalRevenue = totalRevenue; }

    public long getPendingOrders() { return pendingOrders; }
    public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

    public long getConfirmedOrders() { return confirmedOrders; }
    public void setConfirmedOrders(long confirmedOrders) { this.confirmedOrders = confirmedOrders; }

    public long getProcessingOrders() { return processingOrders; }
    public void setProcessingOrders(long processingOrders) { this.processingOrders = processingOrders; }

    public long getShippedOrders() { return shippedOrders; }
    public void setShippedOrders(long shippedOrders) { this.shippedOrders = shippedOrders; }

    public long getDeliveredOrders() { return deliveredOrders; }
    public void setDeliveredOrders(long deliveredOrders) { this.deliveredOrders = deliveredOrders; }

    public long getCancelledOrders() { return cancelledOrders; }
    public void setCancelledOrders(long cancelledOrders) { this.cancelledOrders = cancelledOrders; }

    public List<AdminOrderDTO> getRecentOrders() { return recentOrders; }
    public void setRecentOrders(List<AdminOrderDTO> recentOrders) { this.recentOrders = recentOrders; }
}

class AdminCustomerDTO {
    private Long id;
    private String name;
    private String email;
    private String role;
    private String joinedDate;
    private int totalOrders;
    private double totalSpent;

    public static AdminCustomerDTO fromUser(User user) {
        AdminCustomerDTO dto = new AdminCustomerDTO();
        dto.setId(user.getId());
        dto.setName(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole());
        dto.setJoinedDate(user.getCreatedAt() != null ?
                user.getCreatedAt().toLocalDate().toString() : "N/A");
        dto.setTotalOrders(0); // You can calculate this from orders
        dto.setTotalSpent(0.0); // You can calculate this from orders
        return dto;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getJoinedDate() { return joinedDate; }
    public void setJoinedDate(String joinedDate) { this.joinedDate = joinedDate; }

    public int getTotalOrders() { return totalOrders; }
    public void setTotalOrders(int totalOrders) { this.totalOrders = totalOrders; }

    public double getTotalSpent() { return totalSpent; }
    public void setTotalSpent(double totalSpent) { this.totalSpent = totalSpent; }
}