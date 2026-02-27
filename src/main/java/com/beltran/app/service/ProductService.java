package com.beltran.app.service;

import com.beltran.app.domain.AvailabilityStatus;
import com.beltran.app.domain.Product;
import com.beltran.app.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Optional<Product> findById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> findByCategoryId(Long categoryId) {
        return productRepository.findByCategoryId(categoryId);
    }

    @Transactional
    public Product save(Product product) {
        updateAvailabilityStatusBasedOnStock(product);
        return productRepository.save(product);
    }

    @Transactional
    public void deleteById(Long id) {
        productRepository.deleteById(id);
    }

    private void updateAvailabilityStatusBasedOnStock(Product product) {
        if (product.getStockQuantity() != null && product.getStockQuantity() == 0
                && product.getAvailabilityStatus() != AvailabilityStatus.DISCONTINUED) {
            product.setAvailabilityStatus(AvailabilityStatus.OUT_OF_STOCK);
        } else if (product.getStockQuantity() != null && product.getStockQuantity() > 0
                && product.getAvailabilityStatus() == AvailabilityStatus.OUT_OF_STOCK) {
            product.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);
        }
    }
}
