document.addEventListener('DOMContentLoaded', async () => {
    const productGridContainer = document.querySelector('.product-grid-container');
    const productGrid = document.querySelector('.product-grid');
    const modalContainer = document.getElementById('modal-container');

    function applyDragScroll(container) {
        let isDragging = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            if (e.target.closest('.product')) return;
            isDragging = true;
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
            container.style.cursor = 'grabbing';
        });

        container.addEventListener('mouseleave', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mouseup', () => {
            isDragging = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });

        container.style.cursor = 'grab';
    }

    if (productGridContainer) {
        applyDragScroll(productGridContainer);
    }

    const catalogLinks = document.querySelectorAll('a[href="#categories"]');

    function smoothScrollToCategories(e) {
        e.preventDefault();
        const targetElement = document.getElementById('categories');
        if (targetElement) {
            const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    catalogLinks.forEach(link => {
        link.addEventListener('click', smoothScrollToCategories);
    });

    let cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    let products = [];
    let filteredProducts = [];

    function searchProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        filterProducts(searchTerm);
        displayProducts();
        cancelSearchButton.style.display = searchTerm ? 'block' : 'none';
    }

    try {
        const response = await fetch("http://localhost:8080/api/v1/products");
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        products = await response.json();

        filterProducts();
        displayProducts();

    } catch (error) {
        console.error('Error fetching products:', error);
        productGrid.innerHTML = '<p>Ошибка загрузки продуктов.</p>';
        return;
    }

    function filterProducts(searchTerm = "") {
        const bodyClass = document.body.className.toUpperCase();

        if (bodyClass === "" && searchTerm === "") {
            filteredProducts = products;
        } else if (bodyClass !== "" && searchTerm === "") {
            filteredProducts = products.filter(product => product.category && product.category.toUpperCase() === bodyClass);
        } else if (bodyClass === "" && searchTerm !== "") {
            filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchTerm));
        } else {
            filteredProducts = products.filter(product => product.category && product.category.toUpperCase() === bodyClass && product.name.toLowerCase().includes(searchTerm));
        }
    }

    function displayProducts() {
        productGrid.innerHTML = '';

        if (filteredProducts.length === 0) {
          if (products.length === 0) {
            productGrid.innerHTML = '<p>Ошибка загрузки продуктов.</p>';
            return
          }

           products.forEach(product => {
             const productElement = createProductElement(product)
             productGrid.appendChild(productElement)

             const addToCartBtn = productElement.querySelector('.add-to-cart-btn')
             addToCartBtn.addEventListener('click', () => addToCart(product.id))
           })
           return
        }

        filteredProducts.forEach(product => {
            const productElement = createProductElement(product);
            productGrid.appendChild(productElement);

            const addToCartBtn = productElement.querySelector('.add-to-cart-btn');
            addToCartBtn.addEventListener('click', () => addToCart(product.id));
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', searchProducts);
        searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                searchProducts();
            }
        });
    }

    if (cancelSearchButton) {
        cancelSearchButton.style.display = 'none';
        cancelSearchButton.addEventListener('click', () => {
            searchInput.value = '';
            filterProducts();
            displayProducts();
            cancelSearchButton.style.display = 'none';
        });
    }

    function createProductElement(product) {
        const productElement = document.createElement('div');
        productElement.classList.add('product');
        productElement.dataset.productId = product.id;
        productElement.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.price} руб.</p>
            <button class="add-to-cart-btn">Добавить в корзину</button>
        `;
        return productElement;
    }

    function addToCart(productId) {
        const product = products.find(p => p.id === productId);
    
        if (!product) {
            console.error("Product not found:", productId);
            return;
        }
    
        const modal = document.createElement('div');
    
        modal.classList.add('modal');
    
        modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-info">
            <h3>${product.name}</h3>
            <label for="size">Размер:</label>
            <select id="size">
                ${product.stock.map(stockItem => `<option value="${stockItem.size}">${stockItem.size}</option>`).join('')}
            </select>
            <label for="quantity" id="stock-quantity">В наличии: <span id="available-quantity"></span></label>
            <label for="quantity">Выбрано:</label>
            <input type="number" id="quantity" value="1" min="1">
        </div>
        <div class="image-upload-container">
            <label>Загрузите изображение для принта</label>
            <label>(jpg, png, svg):</label>  </div>
            <img src="" alt="Загруженное изображение" class="modal-image" id="uploaded-image">
            <input type="file" id="imageUpload" accept=".jpg, .png, .svg">


        <div class="modal-footer">
            <button id="modal-add-btn">Добавить</button>
            <button id="modal-close-btn">Закрыть</button>
        </div>
    </div>
`;
    
        modalContainer.appendChild(modal);
    
        const imageUpload = modal.querySelector('#imageUpload');
        const uploadFileName = modal.querySelector('#uploadFileName');
        const uploadedImage = modal.querySelector('#uploaded-image');
        const sizeSelect = modal.querySelector('#size');
        const stockQuantityLabel = modal.querySelector('#stock-quantity');
        const availableQuantitySpan = modal.querySelector('#available-quantity');
        const quantityInput = modal.querySelector('#quantity');
        const addButton = modal.querySelector('#modal-add-btn');
        const closeButton = modal.querySelector('#modal-close-btn');
    
        function updateAvailability() {
            const selectedSize = sizeSelect.value;
            const selectedStockItem = product.stock.find(stockItem => stockItem.size === selectedSize);
    
            if (selectedStockItem) {
                availableQuantitySpan.textContent = selectedStockItem.quantity;
                quantityInput.max = selectedStockItem.quantity;
            } else {
                availableQuantitySpan.textContent = '0';
                quantityInput.max = 0;
            }
        }
    
        sizeSelect.addEventListener('change', updateAvailability);
        updateAvailability();
    
        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImage.src = e.target.result;
                    uploadFileName.textContent = file.name;
                }
                reader.readAsDataURL(file);
                uploadedImage.style.display = 'block';
            }
        });
    
        addButton.addEventListener('click', () => {
            const selectedSize = sizeSelect.value;
            const quantity = parseInt(quantityInput.value);
            addItemToCart(product, selectedSize, quantity);
            modal.remove();
        });
    
        closeButton.addEventListener('click', () => {
            modal.remove();
        });
    
        quantityInput.addEventListener('input', () => {
            const selectedSize = sizeSelect.value;
            const selectedStockItem = product.stock.find(stockItem => stockItem.size === selectedSize);
            const maxQuantity = selectedStockItem ? selectedStockItem.quantity : 0;
            const enteredQuantity = parseInt(quantityInput.value);
    
            if (enteredQuantity > maxQuantity) {
                quantityInput.value = maxQuantity;
            }
        });
    }

    function addItemToCart(product, size, quantity, image) {
        const existingItem = cart.find(item => item.id === product.id && item.size === size);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...product, size, quantity, image });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
    }
});

function openModal() {
    document.getElementById("myModal").style.display = "block";
}

function closeModal() {
    document.getElementById("myModal").style.display = "none";
}

window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        closeModal();
    }
}

const scrollToTopButton = document.createElement('button');
scrollToTopButton.id = 'scrollToTopBtn';
scrollToTopButton.innerHTML = '▲';
scrollToTopButton.title = 'Наверх';
document.body.appendChild(scrollToTopButton);

window.addEventListener('scroll', () => {
  if (window.pageYOffset > 200) {
    scrollToTopButton.style.opacity = '0.7';
    scrollToTopButton.style.transform = 'translateY(0)';
    scrollToTopButton.style.visibility = 'visible';
  } else {
    scrollToTopButton.style.opacity = '0';
    scrollToTopButton.style.transform = 'translateY(20px)';
    scrollToTopButton.style.visibility = 'hidden';
  }
});

scrollToTopButton.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});