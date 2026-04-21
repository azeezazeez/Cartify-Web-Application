package com.cartify.backend.dto;

import com.cartify.backend.entity.OrderStatus;

public class UpdateStatusRequest {
    private OrderStatus status;

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
}