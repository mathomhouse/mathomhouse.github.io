// Function to calculate VIT totals
function calculateVit() {
    // Get input values
    const largeCapsules = parseInt(document.getElementById('vitLargeCapsule').value) || 0;
    const smallCapsules = parseInt(document.getElementById('vitSmallCapsule').value) || 0;
    const plus50 = parseInt(document.getElementById('vitPlus50').value) || 0;
    const plus10 = parseInt(document.getElementById('vitPlus10').value) || 0;
    const flowers = parseInt(document.getElementById('vitFlower').value) || 0;
    const hearts = parseInt(document.getElementById('vitHeart').value) || 0;

    // Calculate totals for each item
    const largeCapsuleTotal = largeCapsules * 100;
    const smallCapsuleTotal = smallCapsules * 30;
    const vitPlus50Total = plus50 * 50;
    const vit10Total = plus10 * 10;
    const vitFlowerTotal = flowers * 30;
    const vitHeartTotal = hearts * 30;

    // Update individual totals
    document.getElementById('largeCapsuleTotal').innerText = largeCapsuleTotal;
    document.getElementById('smallCapsuleTotal').innerText = smallCapsuleTotal;
    document.getElementById('vitPlus50Total').innerText = vitPlus50Total;
    document.getElementById('vit10Total').innerText = vit10Total;
    document.getElementById('vitFlowerTotal').innerText = vitFlowerTotal;
    document.getElementById('vitHeartTotal').innerText = vitHeartTotal;

    // Calculate and update grand total
    const grandTotal = largeCapsuleTotal + smallCapsuleTotal + vitPlus50Total + vit10Total + vitFlowerTotal + vitHeartTotal;
    document.getElementById('grandTotal').innerText = grandTotal;

    // Update the multiplied total too
    updateMultipliedTotal();
}

// Function to update the multiplied total
function updateMultipliedTotal() {
    const grandTotal = parseInt(document.getElementById('grandTotal').innerText) || 0;
    const multiplier = parseInt(document.getElementById('multiplierDropdown').value) || 1;
    const multipliedValue = grandTotal * multiplier;
    document.getElementById('multipliedTotal').innerText = multipliedValue;
}

// Function to reset all input fields and totals
function resetVit() {
    // Reset input fields
    document.getElementById('vitLargeCapsule').value = '';
    document.getElementById('vitSmallCapsule').value = '';
    document.getElementById('vitPlus50').value = '';
    document.getElementById('vitPlus10').value = '';
    document.getElementById('vitFlower').value = '';
    document.getElementById('vitHeart').value = '';

    // Reset totals
    document.getElementById('largeCapsuleTotal').innerText = '';
    document.getElementById('smallCapsuleTotal').innerText = '';
    document.getElementById('vitPlus50Total').innerText = '';
    document.getElementById('vit10Total').innerText = '';
    document.getElementById('vitFlowerTotal').innerText = '';
    document.getElementById('vitHeartTotal').innerText = '';
    document.getElementById('grandTotal').innerText = '';
    document.getElementById('multipliedTotal').innerText = '';

    // Reset multiplier dropdown back to first option (optional)
    document.getElementById('multiplierDropdown').selectedIndex = 0;
}

// Automatically recalculate when user inputs values
document.getElementById('vitLargeCapsule').addEventListener('input', calculateVit);
document.getElementById('vitSmallCapsule').addEventListener('input', calculateVit);
document.getElementById('vitPlus50').addEventListener('input', calculateVit);
document.getElementById('vitPlus10').addEventListener('input', calculateVit);
document.getElementById('vitFlower').addEventListener('input', calculateVit);
document.getElementById('vitHeart').addEventListener('input', calculateVit);

// Recalculate when the multiplier dropdown changes
document.getElementById('multiplierDropdown').addEventListener('change', updateMultipliedTotal);
