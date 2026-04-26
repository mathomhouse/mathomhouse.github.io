// List of items (each entry is unique even if names repeat)
    const items = [
      {name: "Fading Wings", price: 25, maxQty: 1, currency: "tokens"},
      {name: "Ashen Bones", price: 25, maxQty: 1, currency: "tokens"},
      {name: "Undead Skydrake", price: 20, maxQty: 1, currency: "tokens"},
      {name: "Stone Circle", price: 16, maxQty: 1, currency: "tokens"},
      {name: "Golden Glaze", price: 12, maxQty: 2, currency: "tokens"},
      {name: "The Rock", price: 20, maxQty: 1, currency: "tokens"},
      {name: "Pantheon", price: 50, maxQty: 1, currency: "tokens"},
      {name: "Power Fist", price: 20, maxQty: 1, currency: "tokens"},
      {name: "The Labyrinth", price: 120, maxQty: 1, currency: "tokens"},
      {name: "Roaring Chariot", price: 20, maxQty: 1, currency: "tokens"},
      {name: "Scaramanga Shard", price: 2, maxQty: 10, currency: "tokens"},
      {name: "Silence Shard", price: 2, maxQty: 10, currency: "tokens"},      
      {name: "Orange Blueprint Choice Pack", price: 20, maxQty: 1, currency: "tokens"},
      {name: "Top-tier Catalyst", price: 6, maxQty: 5, currency: "tokens"},
      {name: "Stabilizer", price: 10, maxQty: 2, currency: "tokens"},
      {name: "Enigma Repeater x2", price: 1, maxQty: 15, currency: "tokens"},
      {name: "Legendary Beast Shard x10", price: 1, maxQty: 30, currency: "tokens"},
      {name: "Royal Dragon Boat", price: 5000, maxQty: 1, currency: "signets"},
      {name: "Golden Decoration Choice Chest", price: 60000, maxQty: 1, currency: "signets"},
      {name: "Large VIT Capsules", price: 500, maxQty: 30, currency: "signets"},
      {name: "1,000 Odinium", price: 800, maxQty: 30, currency: "signets"},
      {name: "Unit +1 Choice Chest", price: 320, maxQty: 100, currency: "signets"},
      {name: "Orange Universal Shard", price: 1400, maxQty: 30, currency: "signets"},
      {name: "Universal Exclusive Skill Shard", price: 80, maxQty: 200, currency: "signets"},
      {name: "Rare Skill Chest", price: 250, maxQty: 50, currency: "signets"},
      {name: "Lv. 3 CPNT Chest", price: 50, maxQty: 150, currency: "signets"},
      {name: "Lv. 3 CPNT Chest (NEW)", price: 50, maxQty: 150, currency: "signets"},
      {name: "Class Talent Speed-up (1h)", price: 100, maxQty: 80, currency: "signets"},
      {name: "Class Item Chests", price: 650, maxQty: 20, currency: "signets"},
      {name: "Random Purple Equip Blueprint", price: 3200, maxQty: 2, currency: "signets"},
      {name: "Expert HT Chip Chest", price: 5000, maxQty: 2, currency: "signets"},
      {name: "Amazing HT Chip Chest", price: 1000, maxQty: 10, currency: "signets"},
      {name: "HT Chip Chest", price: 500, maxQty: 30, currency: "signets"},
      {name: "Formation Manual Choice Chest (New)", price: 1500, maxQty: 10, currency: "signets"},
      {name: "Hologram Choice Chest", price: 800, maxQty: 20, currency: "signets"},
      {name: "Resonator Choice Chest", price: 3000, maxQty: 5, currency: "signets"},
      {name: "Top-tier Catalyst", price: 12000, maxQty: 2, currency: "signets"},
      {name: "Advanced-tier Catalyst", price: 3000, maxQty: 5, currency: "signets"},
      {name: "Titan Gear Random Material Box x5", price: 1500, maxQty: 10, currency: "signets"},
      {name: "Legendary Beast Shard x10", price: 2000, maxQty: 10, currency: "signets"},
      {name: "Ultra Enigma Crystal (Whole)", price: 300, maxQty: 50, currency: "signets"}
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
          <p>Price: ${item.price} ${item.currency}</p>
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

      const userTokens = parseInt(document.getElementById('ancientTokens').value) || 0;
      const cartTokens = cart.filter(c=> c.currency == "tokens");
      const totalTokenCost = cartTokens.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
      const remainingTokenCost = userTokens - totalTokenCost;

      const userSignets = parseInt(document.getElementById('eternalSignets').value) || 0;
      const cartSignets = cart.filter(c=> c.currency == "signets");
      const totalSignetCost = cartSignets.reduce((sum, ci) => sum + ci.price * ci.quantity, 0);
      const remainingSignetCost = userSignets - totalSignetCost;
      
      var totals = `Total: ${totalTokenCost} Tokens<br>Remaining: ${remainingTokenCost} Tokens<br><br>
            Total: ${totalSignetCost} Signets<br>Remaining: ${remainingSignetCost} Signets`;

      document.getElementById('totalCost').innerHTML = totals;

      if(totalTokenCost > userTokens && totalSignetCost > userSignets){
        document.getElementById('message').innerHTML = 'You do not have enough Ancient Tokens!<br>You do not have enough Eternal Signets!';
      }
      else if (totalTokenCost > userTokens) {
        document.getElementById('message').innerHTML = 'You do not have enough Ancient Tokens!';
      } 
      else if (totalSignetCost > userSignets) {
        document.getElementById('message').innerHTML = 'You do not have enough Eternal Signets!';
      }
      else {
        document.getElementById('message').innerHTML = '';
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