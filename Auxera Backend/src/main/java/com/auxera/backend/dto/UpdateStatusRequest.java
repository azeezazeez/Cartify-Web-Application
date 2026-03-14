package com.auxera.backend.dto;

import com.auxera.backend.entity.OrderStatus;

public class UpdateStatusRequest {
    private OrderStatus status;

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
}