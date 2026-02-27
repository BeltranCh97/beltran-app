package com.beltran.app.controller;

import com.beltran.app.domain.Category;
import com.beltran.app.service.CategoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoryController.class)
class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CategoryService categoryService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetCategoryById() throws Exception {
        Category category = new Category(1L, "Test", "Test Desc");
        when(categoryService.findById(1L)).thenReturn(Optional.of(category));

        mockMvc.perform(get("/api/categories/1"))
                .andExpect(status().isOk());
    }

    @Test
    void testCreateCategory() throws Exception {
        Category category = new Category();
        category.setName("Test");

        Category saved = new Category(1L, "Test", "Test Desc");
        when(categoryService.save(any(Category.class))).thenReturn(saved);

        mockMvc.perform(post("/api/categories")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(category)))
                .andExpect(status().isCreated());
    }
}
