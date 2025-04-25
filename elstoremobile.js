// List of items (each entry is unique even if names repeat)
const items = [
      {name: "Fading Wings", price: 25, maxQty: 1},
      {name: "Ashen Bones", price: 25, maxQty: 1},
      {name: "Undead Skydrake", price: 20, maxQty: 1},
      {name: "Stone Circle", price: 16, maxQty: 1},
      {name: "Golden Glaze", price: 12, maxQty: 2},
      {name: "The Rock", price: 20, maxQty: 1},
      {name: "Pantheon", price: 50, maxQty: 1},
      {name: "Power Fist", price: 20, maxQty: 1},
      {name: "The Labyrinth", price: 120, maxQty: 1},
      {name: "Roaring Chariot", price: 20, maxQty: 1},
      {name: "Scaramanga Shard", price: 10, maxQty: 2},
      {name: "Silence Shard", price: 10, maxQty: 2},      
      {name: "Orange Blueprint Choice Pack", price: 20, maxQty: 1},
      {name: "Top-tier Catalyst", price: 6, maxQty: 5},
      {name: "Stabilizer", price: 10, maxQty: 2},
      {name: "Enigma Repeater x2", price: 1, maxQty: 15},
      {name: "Legendary Beast Shard x10", price: 1, maxQty: 30},


      {name: "Royal Dragon Boat", price: 5000, maxQty: 1},
      {name: "Golden Decoration Choice Chest", price: 60000, maxQty: 1},
      {name: "Large VIT Capsules", price: 500, maxQty: 30},
      {name: "1,000 Odinium", price: 800, maxQty: 30},
      {name: "Unit +1 Choice Chest", price: 320, maxQty: 100},
      {name: "Orange Universal Shard", price: 1400, maxQty: 30},
      {name: "Universal Exclusive Skill Shard", price: 80, maxQty: 200},
      {name: "Rare Skill Chest", price: 250, maxQty: 50}
      {name: "Lv. 3 CPNT Chest", price: 50, maxQty: 150},
      {name: "Lv. 3 CPNT Chest (NEW)", price: 50, maxQty: 150},
      {name: "Class Talent Speed-up (1h)", price: 100, maxQty: 80},
      {name: "Class Item Chests", price: 650, maxQty: 20},
      {name: "Random Purple Equip Blueprint", price: 3200, maxQty: 2},
      {name: "Expert HT Chip Chest", price: 5000, maxQty: 2},
      {name: "Amazing HT Chip Chest", price: 1000, maxQty: 10},
      {name: "HT Chip Chest", price: 500, maxQty: 30},
      {name: "Formation Manual Choice Chest (New)", price: 1500, maxQty: 10}
      {name: "Hologram Choice Chest", price: 800, maxQty: 20},
      {name: "Resonator Choice Chest", price: 3000, maxQty: 5},
      {name: "Top-tier Catalyst", price: 12000, maxQty: 2},
      {name: "Advanced-tier Catalyst", price: 3000, maxQty: 5},
      {name: "Titan Gear Random Material Box x5", price: 1500, maxQty: 10},
      {name: "Legendary Beast Shard x10", price: 2000, maxQty: 10},
      {name: "Ultra Enigma Crystal (Whole)", price: 300, maxQty: 50}
    ];

    let cart = [];

    // Create store items dynamically
    function createStoreItems() {
  const storeDiv = document.getElementById("store");
  storeDiv.innerHTML = "";

  items.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "store-item";
    itemDiv.innerHTML = `
      <h3>${item.name}</h3>
      <p>Price: ${item.price} Points</p>
      <button class="add-to-cart" onclick="openModal(${index})">Select</button>
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
    function addToCart(index, quantity) {
  if (isNaN(quantity) || quantity <= 0) return;
  const item = items[index];

  let cartItem = cart.find(ci => ci.index === index);
  if (cartItem) {
    if (quantity > item.maxQty) {
      alert(`You can only buy up to ${item.maxQty} of this item.`);
      return;
    }
    cartItem.quantity = quantity;
  } else {
    cartItem = { ...item, quantity: quantity, index };
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

    // Function to open modal
    function openModal(index) {
      const item = items[index];
      document.getElementById("modal-title").textContent = item.name;
      document.getElementById("modal-price").textContent = `Price: ${item.price} Points`;
      document.getElementById("modal-range").max = item.maxQty;
      document.getElementById("modal-quantity").max = item.maxQty;
      document.getElementById("modal-range").value = 0;
      document.getElementById("modal-quantity").value = 0;

      document.getElementById("modal").classList.add("active");
      document.getElementById("modal-overlay").classList.add("active");

      document.getElementById("modal-add-to-cart").onclick = function () {
  const quantity = parseInt(document.getElementById("modal-quantity").value);
  addToCart(index, quantity);
  closeModal();
    };
    }

    // Function to close modal
    function closeModal() {
      document.getElementById("modal").classList.remove("active");
      document.getElementById("modal-overlay").classList.remove("active");
    }

    // Synchronize range and number input inside modal
    document.getElementById("modal-range").addEventListener("input", function () {
      document.getElementById("modal-quantity").value = this.value;
    });

    document.getElementById("modal-quantity").addEventListener("input", function () {
      document.getElementById("modal-range").value = this.value;
    });

    // Close modal when overlay is clicked
    document.getElementById("modal-overlay").addEventListener("click", closeModal);


    // Initialize the store
    createStoreItems();

    // Floating Cart Toggle Functionality
document.getElementById("cart-toggle").addEventListener("click", function () {
  const cart = document.querySelector(".cart");
  if (cart.style.display === "none" || cart.style.display === "") {
    cart.style.display = "block"; // Show cart
    cart.scrollIntoView({ behavior: "smooth" }); // Scroll to cart smoothly
  } else {
    cart.style.display = "none"; // Hide cart
  }
});