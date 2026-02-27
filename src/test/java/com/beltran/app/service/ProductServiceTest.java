package com.beltran.app.service;

import com.beltran.app.domain.AvailabilityStatus;
import com.beltran.app.domain.Product;
import com.beltran.app.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    @Test
    void testSaveUpdatesAvailabilityStatusToOutOfStock() {
        Product product = new Product();
        product.setStockQuantity(0);
        product.setAvailabilityStatus(AvailabilityStatus.AVAILABLE);

        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product savedProduct = productService.save(product);

        assertEquals(AvailabilityStatus.OUT_OF_STOCK, savedProduct.getAvailabilityStatus());
    }

    @Test
    void testSaveUpdatesAvailabilityStatusToAvailable() {
        Product product = new Product();
        product.setStockQuantity(10);
        product.setAvailabilityStatus(AvailabilityStatus.OUT_OF_STOCK);

        when(productRepository.save(any(Product.class))).thenReturn(product);

        Product savedProduct = productService.save(product);

        assertEquals(AvailabilityStatus.AVAILABLE, savedProduct.getAvailabilityStatus());
    }
}
