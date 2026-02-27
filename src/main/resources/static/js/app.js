// Base API URL
const API_URL = '/api';

// Cached Data
let categoriesData = [];
let productsData = [];

// DOM Elements
const views = document.querySelectorAll('.view-section');
const navItems = document.querySelectorAll('.nav-item');

// --- Routing & Navigation ---
function switchView(targetId) {
    // Update nav active state
    navItems.forEach(item => {
        if (item.dataset.target === targetId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update views
    views.forEach(view => {
        if (view.id === targetId) {
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    });

    // Refresh data based on view
    if (targetId === 'categories-view') {
        categoryService.loadCategories();
    } else if (targetId === 'products-view') {
        productService.loadProducts();
    } else if (targetId === 'dashboard-view') {
        dashboardService.loadDashboardMetrics();
    }
}

// Event Listeners for Navigation
navItems.forEach(item => {
    item.addEventListener('click', () => {
        switchView(item.dataset.target);
    });
});

// --- Toast Notifications ---
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// --- Generic Fetch Helper ---
async function apiFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            // Handle expected errors like 400 or 404
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}`);
        }
        // DELETE often has no content
        if (response.status === 204) return null;
        return await response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error);
        showToast(error.message || 'Error en la conexión con el servidor', 'error');
        throw error;
    }
}

// --- Categories ---
const categoryService = {
    loadCategories: async () => {
        try {
            categoriesData = await apiFetch('/categories');
            categoryUI.renderTable();
            categoryUI.updateSelects();
        } catch (e) { }
    },

    saveCategory: async (category) => {
        try {
            if (category.id) {
                await apiFetch(`/categories/${category.id}`, 'PUT', category);
                showToast('Categoría actualizada exitosamente', 'success');
            } else {
                await apiFetch('/categories', 'POST', category);
                showToast('Categoría creada exitosamente', 'success');
            }
            categoryUI.closeModal();
            await categoryService.loadCategories(); // Refresh list
        } catch (e) { }
    },

    deleteCategory: async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta categoría? (Los productos asociados podrían dar error)')) return;
        try {
            await apiFetch(`/categories/${id}`, 'DELETE');
            showToast('Categoría eliminada', 'success');
            await categoryService.loadCategories(); // Refresh list
        } catch (e) { }
    }
};

const categoryUI = {
    openModal: (id = null) => {
        const modal = document.getElementById('category-modal');
        const form = document.getElementById('category-form');
        const title = document.getElementById('category-modal-title');

        form.reset();
        document.getElementById('category-id').value = '';

        if (id) {
            title.textContent = 'Editar Categoría';
            const cat = categoriesData.find(c => c.id === id);
            if (cat) {
                document.getElementById('category-id').value = cat.id;
                document.getElementById('category-name').value = cat.name;
                document.getElementById('category-desc').value = cat.description;
            }
        } else {
            title.textContent = 'Nueva Categoría';
        }

        modal.classList.remove('hidden');
    },

    closeModal: () => document.getElementById('category-modal').classList.add('hidden'),

    renderTable: () => {
        const tbody = document.querySelector('#categories-table tbody');
        if (categoriesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay categorías registradas.</td></tr>';
            return;
        }

        tbody.innerHTML = categoriesData.map(c => `
            <tr>
                <td>#${c.id}</td>
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td style="color: var(--text-secondary)">${escapeHtml(c.description || '-')}</td>
                <td>
                    <button class="btn-icon edit" onclick="categoryUI.openModal(${c.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="categoryService.deleteCategory(${c.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    updateSelects: () => {
        // Update product modal select and filter select
        const pSelect = document.getElementById('product-category');
        const pFilter = document.getElementById('filter-category-select');

        const optionsHTML = categoriesData.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

        pSelect.innerHTML = `<option value="" disabled selected>Seleccione una categoría</option>${optionsHTML}`;
        pFilter.innerHTML = `<option value="">Todas las categorías</option>${optionsHTML}`;
    }
};

// Listen to Form Submit
document.getElementById('category-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('category-id').value;
    const cat = {
        name: document.getElementById('category-name').value,
        description: document.getElementById('category-desc').value
    };
    if (id) cat.id = parseInt(id);
    categoryService.saveCategory(cat);
});

// --- Products ---
const productService = {
    loadProducts: async () => {
        try {
            // we also need categories to show names if the API only returns objects or IDs
            if (categoriesData.length === 0) await categoryService.loadCategories();
            productsData = await apiFetch('/products');
            productUI.renderTable();
        } catch (e) { }
    },

    saveProduct: async (product) => {
        try {
            if (product.id) {
                await apiFetch(`/products/${product.id}`, 'PUT', product);
                showToast('Producto actualizado exitosamente', 'success');
            } else {
                await apiFetch('/products', 'POST', product);
                showToast('Producto creado exitosamente', 'success');
            }
            productUI.closeModal();
            await productService.loadProducts(); // Refresh list
        } catch (e) { }
    },

    deleteProduct: async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await apiFetch(`/products/${id}`, 'DELETE');
            showToast('Producto eliminado', 'success');
            await productService.loadProducts(); // Refresh list
        } catch (e) { }
    }
};

const productUI = {
    openModal: (id = null) => {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        const title = document.getElementById('product-modal-title');

        form.reset();
        document.getElementById('product-id').value = '';

        if (categoriesData.length === 0) {
            showToast('Primero debes crear categorías', 'warning');
            return;
        }

        if (id) {
            title.textContent = 'Editar Producto';
            const prod = productsData.find(p => p.id === id);
            if (prod) {
                document.getElementById('product-id').value = prod.id;
                document.getElementById('product-name').value = prod.name;
                document.getElementById('product-desc').value = prod.description || '';
                document.getElementById('product-price').value = prod.price;
                document.getElementById('product-stock').value = prod.stockQuantity;
                document.getElementById('product-status').value = prod.availabilityStatus;

                // Extract category ID (assuming backend returns category object)
                const catId = prod.category ? prod.category.id : '';
                document.getElementById('product-category').value = catId;
            }
        } else {
            title.textContent = 'Nuevo Producto';
        }

        modal.classList.remove('hidden');
    },

    closeModal: () => document.getElementById('product-modal').classList.add('hidden'),

    renderTable: () => {
        const tbody = document.querySelector('#products-table tbody');
        const filterVal = document.getElementById('filter-category-select').value;

        let filtered = productsData;
        if (filterVal) {
            filtered = productsData.filter(p => p.category && p.category.id == filterVal);
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay productos para mostrar.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(p => {
            const catName = p.category ? escapeHtml(p.category.name) : 'Sin Categoría';
            const price = parseFloat(p.price).toFixed(2);
            let statusLabel = 'Disponible';
            if (p.availabilityStatus === 'LOW_STOCK') statusLabel = 'Stock Bajo';
            if (p.availabilityStatus === 'OUT_OF_STOCK') statusLabel = 'Agotado';

            return `
            <tr>
                <td>#${p.id}</td>
                <td>
                    <strong>${escapeHtml(p.name)}</strong>
                    <div style="font-size:12px;color:var(--text-secondary)">${escapeHtml(p.description || '')}</div>
                </td>
                <td><span style="background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:4px;font-size:13px;">${catName}</span></td>
                <td><strong>$${price}</strong></td>
                <td>${p.stockQuantity}</td>
                <td><span class="status-badge status-${p.availabilityStatus}">${statusLabel}</span></td>
                <td>
                    <button class="btn-icon edit" onclick="productUI.openModal(${p.id})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon delete" onclick="productService.deleteProduct(${p.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `}).join('');
    }
};

// Listen to Product Filter
document.getElementById('filter-category-select').addEventListener('change', productUI.renderTable);

// Listen to Form Submit
document.getElementById('product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('product-id').value;
    const prod = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-desc').value,
        price: parseFloat(document.getElementById('product-price').value),
        stockQuantity: parseInt(document.getElementById('product-stock').value),
        availabilityStatus: document.getElementById('product-status').value,
        category: { id: parseInt(document.getElementById('product-category').value) }
    };
    if (id) prod.id = parseInt(id);
    productService.saveProduct(prod);
});


// --- Dashboard Metrics ---
const dashboardService = {
    loadDashboardMetrics: async () => {
        try {
            // Ensure we have data
            categoriesData = await apiFetch('/categories');
            productsData = await apiFetch('/products');

            // Update DOM Stats
            document.getElementById('stat-categories').textContent = categoriesData.length;
            document.getElementById('stat-products').textContent = productsData.length;

            const totalValue = productsData.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);
            document.getElementById('stat-value').textContent = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            // Update Recent Adds Table (Last 5)
            const recent = [...productsData].sort((a, b) => b.id - a.id).slice(0, 5);
            const tbody = document.querySelector('#dashboard-recent-table tbody');

            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay productos recientes.</td></tr>';
                return;
            }

            tbody.innerHTML = recent.map(p => {
                const catName = p.category ? escapeHtml(p.category.name) : '-';
                let statusLabel = 'Disponible';
                if (p.availabilityStatus === 'LOW_STOCK') statusLabel = 'Stock Bajo';
                if (p.availabilityStatus === 'OUT_OF_STOCK') statusLabel = 'Agotado';

                return `<tr>
                    <td><strong>${escapeHtml(p.name)}</strong></td>
                    <td>${catName}</td>
                    <td>$${parseFloat(p.price).toFixed(2)}</td>
                    <td><span class="status-badge status-${p.availabilityStatus}">${statusLabel}</span></td>
                </tr>`;
            }).join('');

        } catch (e) {
            console.error("Dashboard error", e);
        }
    }
};

// Utils
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    dashboardService.loadDashboardMetrics();
});
