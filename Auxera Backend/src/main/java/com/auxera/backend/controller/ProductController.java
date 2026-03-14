package com.auxera.backend.controller;

import com.auxera.backend.dto.ApiResponse;
import com.auxera.backend.entity.Product;
import com.auxera.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin("*")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {

        List<Product> products;

        if (search != null && !search.isEmpty()) {
            products = productRepository.searchProducts(search);
        } else if (category != null && !category.isEmpty() && !category.equals("All")) {
            products = productRepository.findByCategoryIgnoreCase(category);
        } else {
            products = productRepository.findAll();
        }

        return ResponseEntity.ok(ApiResponse.success("Products fetched", products));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable String id) {
        return productRepository.findById(id)
                .map(product -> ResponseEntity.ok(ApiResponse.success("Product found", product)))
                .orElse(ResponseEntity.notFound().build());
    }
}