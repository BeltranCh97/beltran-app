package com.beltran.app.service;

import com.beltran.app.domain.Category;
import com.beltran.app.repository.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    void testFindById() {
        Category category = new Category(1L, "Electronics", "Devices and gadgets");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(category));

        Optional<Category> found = categoryService.findById(1L);

        assertTrue(found.isPresent());
        assertEquals("Electronics", found.get().getName());
        verify(categoryRepository, times(1)).findById(1L);
    }
}
