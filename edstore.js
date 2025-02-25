// List of items (each entry is unique even if names repeat)
    const items = [
      {name: "Orange Universal Shards", price: 1400, maxQty: 40},
      {name: "Orange Universal Shards", price: 1800, maxQty: 40},
      {name: "Orange Universal Shards", price: 2400, maxQty: 40},
      {name: "Universal Exclusive Skill Shards x5", price: 600, maxQty: 20},
      {name: "Universal Exclusive Skill Shards x5", price: 900, maxQty: 20},
      {name: "Universal Exclusive Skill Shards x5", price: 1200, maxQty: 20},
      {name: "Universal Decor Shards x5", price: 600, maxQty: 20},
      {name: "Universal Decor Shards x5", price: 900, maxQty: 20},
      {name: "Universal Decor Shards x5", price: 1200, maxQty: 20},
      {name: "Legendary Beast Chest", price: 24000, maxQty: 3},
      {name: "Epic Beast Chest", price: 4200, maxQty: 10},
      {name: "Ultra Enigma Crystal (Whole) x5", price: 2100, maxQty: 10},
      {name: "Top-tier Catalyst", price: 20000, maxQty: 3},
      {name: "Advanced-tier Catalyst", price: 5000, maxQty: 10},
      {name: "Mid-tier Catalyst", price: 1000, maxQty: 20},
      {name: "Expert HT Chip Chest", price: 6500, maxQty: 10},
      {name: "Amazing HT Chip Chest", price: 1300, maxQty: 10},
      {name: "Power Core", price: 550, maxQty: 25},
      {name: "Universal Formation Upgrade Guide x5", price: 1400, maxQty: 30},
      {name: "Hologram Choice Chest", price: 700, maxQty: 70},
      {name: "Hologram Choice Chest", price: 1400, maxQty: 70},
      {name: "Mastery Research x5", price: 1200, maxQty: 30},
      {name: "Mastery Research x5", price: 2400, maxQty: 30},
      {name: "Titan Gear Random Material Box x5", price: 2500, maxQty: 100},
      {name: "Scent of Victory", price: 2000, maxQty: 1}
    ];

    let cart = [];

    // Create store items dynamically
    function createStoreItems() {
      const storeDiv = document.getElementById('store');
      storeDiv.innerHTML = '';

      items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'store-item';
        itemDiv.innerHTML = `
          <h3>${item.name}</h3>
          <p>Price: ${item.price} Points</p>
          <p>Max Quantity: ${item.maxQty}</p>
          <div class="quantity-control">
            <button class="minus-btn" onclick="decrementQuantity(${index})">-</button>
            <input type="range" id="range${index}" min="0" max="${item.maxQty}" value="0" oninput="syncQuantityFromRange(${index})">
            <button class="plus-btn" onclick="incrementQuantity(${index})">+</button>
            <input type="number" id="quantity${index}" value="0" min="0" max="${item.maxQty}" oninput="syncRangeFromQuantity(${index})">
          </div>
          <button class="add-to-cart" onclick="addToCart(${index})" id="addButton${index}">Add to Cart</button>
        `;
        storeDiv.appendChild(itemDiv);
      });
    }

    // Synchronize slider with number input
    function syncQuantityFromRange(index) {
      const rangeInput = document.getElementById(`range${index}`);
      const numberInput = document.getElementById(`quantity${index}`);
      numberInput.value = rangeInput.value;
    }

    function syncRangeFromQuantity(index) {
      const rangeInput = document.getElementById(`range${index}`);
      const numberInput = document.getElementById(`quantity${index}`);
      rangeInput.value = numberInput.value;
    }

    // Plus and minus button functions
    function incrementQuantity(index) {
      const numberInput = document.getElementById(`quantity${index}`);
      let current = parseInt(numberInput.value);
      const max = parseInt(numberInput.max);
      if (current < max) {
        current++;
        numberInput.value = current;
        syncRangeFromQuantity(index);
      }
    }

    function decrementQuantity(index) {
      const numberInput = document.getElementById(`quantity${index}`);
      let current = parseInt(numberInput.value);
      if (current > 0) {
        current--;
        numberInput.value = current;
        syncRangeFromQuantity(index);
      }
    }

    // Add item to cart using the value from the number input (which is in sync with the slider)
    function addToCart(index) {
      const quantityToAdd = parseInt(document.getElementById(`quantity${index}`).value);
      if (isNaN(quantityToAdd) || quantityToAdd <= 0) return;
      const item = items[index];

      let cartItem = cart.find(ci => ci.index === index);
      if (cartItem) {
        if (quantityToAdd > item.maxQty) {
          alert(`You can only buy up to ${item.maxQty} of this item.`);
          return;
        }
        cartItem.quantity = quantityToAdd;
      } else {
        cartItem = { ...item, quantity: quantityToAdd, index };
        cart.push(cartItem);
      }
      updateCart();
      updateItemStatus(index);
    }

    // Update the cart display and currency check
    function updateCart() {
      const cartItemsDiv = document.getElementById('cartItems');
      cartItemsDiv.innerHTML = '';
      const currency = parseInt(document.getElementById('currency').value) || 0;
      const totalCost = cart.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
      const remainingCost = currency - totalCost;
      document.getElementById('totalCost').innerHTML = `Total: ${totalCost} Points<br>Remaining: ${remainingCost} Points`;

      if (totalCost > currency) {
        document.getElementById('message').textContent = 'You do not have enough points!';
      } else {
        document.getElementById('message').textContent = '';
      }

      cart.forEach(cartItem => {
        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        
        const label = document.createElement('span');
        label.textContent = `${cartItem.name}:`;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = cartItem.quantity;
        input.min = 0;
        input.max = cartItem.maxQty;
        input.id = `cartQuantity${cartItem.index}`;
        // No individual update event here

        const costDisplay = document.createElement('span');
        costDisplay.textContent = `Cost: ${cartItem.price * cartItem.quantity}`;

        cartItemDiv.appendChild(label);
        cartItemDiv.appendChild(input);
        cartItemDiv.appendChild(costDisplay);

        cartItemsDiv.appendChild(cartItemDiv);
      });
    }

    // Global function to update all cart items at once
    function updateCartGlobal() {
      cart.forEach(cartItem => {
        const input = document.getElementById(`cartQuantity${cartItem.index}`);
        const newQuantity = parseInt(input.value);
        const item = items[cartItem.index];
        if (newQuantity > item.maxQty) {
          alert(`You can only buy up to ${item.maxQty} of ${item.name}.`);
          input.value = cartItem.quantity; // Reset if invalid
        } else {
          cartItem.quantity = newQuantity;
        }
      });
      // Remove any items with 0 quantity
      cart = cart.filter(cartItem => cartItem.quantity > 0);
      updateCart();
      for (let i = 0; i < items.length; i++) {
        updateItemStatus(i);
      }
    }

    function updateItemStatus(index) {
      const item = items[index];
      const itemDiv = document.querySelectorAll('.store-item')[index];
      const addButton = itemDiv.querySelector('button.add-to-cart');

      const currentQtyInCart = cart
        .filter(ci => ci.index === index)
        .reduce((acc, ci) => acc + ci.quantity, 0);

      if (currentQtyInCart >= item.maxQty) {
        itemDiv.classList.add('greyed-out');
        addButton.disabled = true;
      } else {
        itemDiv.classList.remove('greyed-out');
        addButton.disabled = false;
      }
    }

    // Initialize the store
    createStoreItems();