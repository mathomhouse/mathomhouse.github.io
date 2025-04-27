const resultElements = [
    'largeCapsuleTotal',
    'smallCapsuleTotal',
    'vitPlus50Total',
    'vit10Total',
    'vitFlowerTotal',// Function to calculate VIT totals
function calculateVit() {
    // Get input values
    const largeCapsules = parseInt(document.getElementById('vitLargeCapsule').value) || 0;
    const smallCapsules = parseInt(document.getElementById('vitSmallCapsule').value) || 0;
    const plus50 = parseInt(document.getElementById('vitPlus50').value) || 0;
    const plus10 = parseInt(document.getElementById('vitPlus10').value) || 0;
    const flowers = parseInt(document.getElementById('vitFlower').value) || 0;
    const hearts = parseInt(document.getElementById('vitHeart').value) || 0;

    // Calculate totals for each item
    const largeCapsuleTotal = largeCapsules * 50;
    const smallCapsuleTotal = smallCapsules * 10;
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
    if (document.getElementById('multiplierDropdown').value != "") {
      updateMultipliedTotal();
    }  
        }

// Function to update the multiplied total
function updateMultipliedTotal() {
    const grandTotal = parseInt(document.getElementById('grandTotal').innerText) || 0;
    const multiplier = parseInt(document.getElementById('multiplierDropdown').value) || 0;
    const multipliedValue = grandTotal * multiplier /5;
    document.getElementById('multipliedTotal').innerText = multipliedValue + " Honor Points";

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

    'vitHeartTotal'
];

function calculateOnBlur(inputElement, multiplier, resultElementId) {
    const value = parseFloat(inputElement.value) || 0; // Get input value or default to 0
    const result = value * multiplier; // Multiply by the provided multiplier

    // Update the total in the respective cell (third column)
    const resultElement = document.getElementById(resultElementId);
    resultElement.innerText = result.toLocaleString("en-US"); // Update with the calculated result

    // Update the grand total after each input change
    updateGrandTotal();
}

function updateGrandTotal() {
    let grandTotal = 0;
    resultElements.forEach(id => {
        const resultValue = parseFloat(document.getElementById(id).innerText.replace(/,/g,'')) || 0;
        grandTotal += resultValue;
    });

    // Update the grand total label
    document.getElementById('grandTotal').innerText = grandTotal.toLocaleString("en-US");
}

function resetTotals(){
    resultElements.forEach(id => {
        document.getElementById(id).innerText = "";
    });
    document.getElementById('grandTotal').innerText = "";
}

window.onload = function () {
    // Define inputs and their respective multipliers and result IDs
    const inputs = [
        { id: 'vitLargeCapsule', multiplier: 50, resultId: 'largeCapsuleTotal' },
        { id: 'vitSmallCapsule', multiplier: 10, resultId: 'smallCapsuleTotal' },
        { id: 'vitPlus50', multiplier: 50, resultId: 'vitPlus50Total' },
        { id: 'vitPlus10', multiplier: 10, resultId: 'vit10Total' },
        { id: 'vitFlower', multiplier: 30, resultId: 'vitFlowerTotal' },
        { id: 'vitHeart', multiplier: 30, resultId: 'vitHeartTotal' }
    ];

    // Attach the same calculateOnBlur function to the onblur event for each input
    inputs.forEach(input => {
        const inputElement = document.getElementById(input.id);
        inputElement.onblur = function () {
            calculateOnBlur(inputElement, input.multiplier, input.resultId);
        };
    });
}

function calculateVit() {
    // Retrieve input values
    const largeCaps = parseFloat(document.getElementById('vitLargeCapsule').value) || 0;
    const smallCaps = parseFloat(document.getElementById('vitSmallCapsule').value) || 0;
    const plus50s = parseFloat(document.getElementById('vitPlus50').value) || 0;
    const plus10s = parseFloat(document.getElementById('vitPlus10').value) || 0;
    const flowers = parseFloat(document.getElementById('vitFlower').value) || 0;
    const hearts = parseFloat(document.getElementById('vitHeart').value) || 0;

    //VIT values
    var largeCapValue = 50;
    var smallCapValue = 10;
    var plus50Value = 50;
    var plus10Value = 10;
    var flowerValue = 30;
    var heartValue = 30;


    const result = (largeCaps * largeCapValue) + (smallCaps * smallCapValue) +
        (plus50s * plus50Value) + (plus10s * plus10Value) +
        (flowers * flowerValue) + (hearts * heartValue);

    // Display the result
    document.getElementById('result').innerHTML = `Your total VIT is: <b>${result}</b>`;
}

function resetVit() {
    document.getElementById('vitLargeCapsule').value = "";
    document.getElementById('vitSmallCapsule').value = "";
    document.getElementById('vitPlus50').value = "";
    document.getElementById('vitPlus10').value = "";
    document.getElementById('vitFlower').value = "";
    document.getElementById('vitHeart').value = "";

    // Clear the result
    //document.getElementById('result').innerHTML = '';

    resetTotals();
}