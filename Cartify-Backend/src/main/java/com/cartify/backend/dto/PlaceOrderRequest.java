package com.cartify.backend.dto;

import lombok.Data;

@Data
public class PlaceOrderRequest {
    private String shippingAddress;
    private String paymentMethod;
}