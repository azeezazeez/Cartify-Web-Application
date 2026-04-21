package com.cartify.backend.controller;

import com.cartify.backend.dto.ApiResponse;
import com.cartify.backend.entity.Product;
import com.cartify.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        List<Product> products;

        if (category != null && !category.isEmpty() && !category.equals("All")) {
            products = productRepository.findByCategory(category);
        } else if (search != null && !search.isEmpty()) {
            products = productRepository.findByNameContainingIgnoreCase(search);
        } else {
            products = productRepository.findAll();
        }

        return ResponseEntity.ok(ApiResponse.success("Products retrieved", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(product -> ResponseEntity.ok(ApiResponse.success("Product found", product)))
                .orElse(ResponseEntity.notFound().build());
    }
}
