package com.cartify.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
public class Product {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double price;

    @Column(length = 1000)
    private String description;

    private String category;
    private String image;
    private Double rating;
    private Integer reviews;

    @Column(name = "is_new")
    private Boolean isNew = false;

    @Column(name = "in_stock")
    private Boolean inStock = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}