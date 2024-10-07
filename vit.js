const resultElements = [
    'largeCapsuleTotal',
    'smallCapsuleTotal',
    'vitPlus50Total',
    'vit10Total',
    'vitFlowerTotal',
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
    document.getElementById('vitSmallCapsule').value = 0;
    document.getElementById('vitPlus50').value = 0;
    document.getElementById('vitPlus10').value = 0;
    document.getElementById('vitFlower').value = 0;
    document.getElementById('vitHeart').value = 0;

    // Clear the result
    //document.getElementById('result').innerHTML = '';

    resetTotals();
}