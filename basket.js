document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const totalPriceElement = document.getElementById('total-price');
    const checkoutButton = document.getElementById('checkout-button');

    let cart = localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        if (cart.length === 0) {
            cartSummary.style.display = 'none';
            document.querySelector('.cart-empty').style.display = 'block';
        } else {
            cart.forEach(item => {
                const cartItemElement = document.createElement('div');
                cartItemElement.innerHTML = `
                    <p>${item.name} (Размер: ${item.size}, Количество: ${item.quantity}) - ${item.price * item.quantity} руб.</p>
                    <button class="remove-btn" data-product-id="${item.id}" data-size="${item.size}">Удалить</button>
                `;
                cartItemsContainer.appendChild(cartItemElement);
                totalPrice += item.price * item.quantity;

                const removeButton = cartItemElement.querySelector('.remove-btn');
                removeButton.addEventListener('click', () => {
                    removeItemFromCart(item.id, item.size);
                    updateCartUI();
                });
            });

            totalPriceElement.textContent = totalPrice;
            cartSummary.style.display = 'block';
            document.querySelector('.cart-empty').style.display = 'none';
        }
    }

    function removeItemFromCart(productId, size) {
        const index = cart.findIndex(item => item.id === productId && item.size === size);
        if (index !== -1) {
            cart.splice(index, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
        }
    }

    updateCartUI();

    checkoutButton.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Корзина пуста!');
            return;
        }

        openOrderModal(); 
    });

    function openOrderModal() {
        const orderModal = document.createElement('div');
        orderModal.classList.add('modal');

        let orderItemsHTML = cart.map(item => `<p>${item.name} (Размер: ${item.size}, Количество: ${item.quantity}) - ${item.price * item.quantity} руб.</p>`).join('');


        orderModal.innerHTML = `
            <div class="modal-content">
                <h3>Информация о заказе</h3>
                ${orderItemsHTML}

                <label for="name">Имя:</label>
                <input type="text" id="name" required>

                <label for="phone">Номер телефона:</label>
                <input type="tel" id="phone" required>

                <label for="address">Адрес доставки:</label>
                <textarea id="address" required></textarea>

                <div class="modal-footer">
                    <button id="order-confirm-btn">Подтвердить заказ</button>
                    <button id="order-cancel-btn">Отмена</button>
                </div>
            </div>
        `;

        document.body.appendChild(orderModal);

        const confirmButton = orderModal.querySelector('#order-confirm-btn');
        const cancelButton = orderModal.querySelector('#order-cancel-btn');


        confirmButton.addEventListener('click', () => {
            const name = orderModal.querySelector('#name').value;
            const phone = orderModal.querySelector('#phone').value;
            const address = orderModal.querySelector('#address').value;

            if (!name || !phone || !address) {
                alert('Пожалуйста, заполните все поля!');
                return;
            }


            console.log('Заказ оформлен:', {
                cart: cart, // весь массив корзины
                name: name,
                phone: phone,
                address: address
            });


            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartUI();
            orderModal.remove();


            // Модальное окно подтверждения заказа
            const confirmationModal = document.createElement('div');
            confirmationModal.classList.add('modal');
            confirmationModal.innerHTML = `
                <div class="modal-content">
                    <h3>Подтвердите действие</h3>
                    <p>Заказ оформлен!</p>
                    <div class="modal-footer">
                        <button id="confirmation-ok-btn">OK</button>
                    </div>
                </div>
            `;

            document.body.appendChild(confirmationModal);

            const okButton = confirmationModal.querySelector('#confirmation-ok-btn');
            okButton.addEventListener('click', () => {
                confirmationModal.remove();
            });
        });


        cancelButton.addEventListener('click', () => {
            orderModal.remove();
        });

    }
});