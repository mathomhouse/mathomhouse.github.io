const gemTotalElements =[
    'openGemsTotal', '12960GemsTotal',
    '5000GemsTotal', '4000GemsTotal',
    '3280GemsTotal', '3000GemsTotal', 
    '2560GemsTotal', '2024GemsTotal', 
    '2000GemsTotal', '1280GemsTotal', 
    '1200GemsTotal', '1000GemsTotal', 
    '800GemsTotal',  '600GemsTotal', 
    '500GemsTotal',  '400GemsTotal', 
    '300GemsTotal',  '240GemsTotal', 
    '200GemsTotal',  '150GemsTotal', 
    '120GemsTotal',  '100GemsTotal',
    '60GemsTotal',   '50GemsTotal',
    '30GemsTotal',   '20GemsTotal',
    '10GemsTotal'
]

let customRowCount = 0;

window.onload = function () {
    const inputs = [
        {id: 'opengems', multiplier: 1, resultId: 'openGemsTotal'},
        {id: '12960gems', multiplier: 12960, resultId: '12960GemsTotal'},
        {id: '5000gems', multiplier: 5000, resultId: '5000GemsTotal'},
        {id: '4000gems', multiplier: 4000, resultId: '4000GemsTotal'},
        {id: '3280gems', multiplier: 3280, resultId: '3280GemsTotal'},
        {id: '3000gems', multiplier: 3000, resultId: '3000GemsTotal'},
        {id: '2560gems', multiplier: 2560, resultId: '2560GemsTotal'},
        {id: '2024gems', multiplier: 2024, resultId: '2024GemsTotal'},
        {id: '2000gems', multiplier: 2000, resultId: '2000GemsTotal'},
        {id: '1280gems', multiplier: 1280, resultId: '1280GemsTotal'},
        {id: '1200gems', multiplier: 1200, resultId: '1200GemsTotal'},
        {id: '1000gems', multiplier: 1000, resultId: '1000GemsTotal'},
        {id: '800gems', multiplier: 800, resultId: '800GemsTotal'},
        {id: '600gems', multiplier: 600, resultId: '600GemsTotal'},
        {id: '500gems', multiplier: 500, resultId: '500GemsTotal'},
        {id: '400gems', multiplier: 400, resultId: '400GemsTotal'},
        {id: '300gems', multiplier: 300, resultId: '300GemsTotal'},
        {id: '240gems', multiplier: 240, resultId: '240GemsTotal'},
        {id: '200gems', multiplier: 200, resultId: '200GemsTotal'},
        {id: '150gems', multiplier: 150, resultId: '150GemsTotal'},
        {id: '120gems', multiplier: 120, resultId: '120GemsTotal'},
        {id: '100gems', multiplier: 100, resultId: '100GemsTotal'},
        {id: '60gems', multiplier: 60, resultId: '60GemsTotal'},
        {id: '50gems', multiplier: 50, resultId: '50GemsTotal'},
        {id: '30gems', multiplier: 30, resultId: '30GemsTotal'},
        {id: '20gems', multiplier: 20, resultId: '20GemsTotal'},
        {id: '10gems', multiplier: 10, resultId: '10GemsTotal'},
    ]

    // Attach the same calculateOnBlur function to the onblur event for each input
    inputs.forEach(input => {
        const inputElement = document.getElementById(input.id);
        inputElement.onblur = function () {
            calculateOnBlur(inputElement, input.multiplier, input.resultId);
        };
    });
    addCustomRow();
}

function calculateOnBlur(inputElement, multiplier, resultElementId) {
    const value = parseFloat(inputElement.value) || 0; // Get input value or default to 0
    const result = value * multiplier; // Multiply by the provided multiplier

    // Update the total in the respective cell (third column)
    const resultElement = document.getElementById(resultElementId);
    resultElement.innerText = result.toLocaleString("en-US"); // Update with the calculated result

    // Update the grand total after each input change
    calculateGrandTotal();
}

function resetGems() {
    document.getElementById('opengems').value = "";
    document.getElementById('100gems').value = "";
    document.getElementById('50gems').value = "";
    document.getElementById('60gems').value = "";
    document.getElementById('30gems').value = "";
    document.getElementById('20gems').value = "";
    document.getElementById('10gems').value = "";
    document.getElementById('120gems').value = "";
    document.getElementById('150gems').value = "";
    document.getElementById('200gems').value = "";
    document.getElementById('240gems').value = "";
    document.getElementById('300gems').value = "";
    document.getElementById('400gems').value = "";
    document.getElementById('500gems').value = "";
    document.getElementById('600gems').value = "";
    document.getElementById('800gems').value = "";
    document.getElementById('1000gems').value = "";
    document.getElementById('1200gems').value = "";
    document.getElementById('1280gems').value = "";
    document.getElementById('2000gems').value = "";
    document.getElementById('2024gems').value = "";
    document.getElementById('2560gems').value = "";
    document.getElementById('3000gems').value = "";
    document.getElementById('3280gems').value = "";
    document.getElementById('4000gems').value = "";
    document.getElementById('5000gems').value = "";
    document.getElementById('12960gems').value = "";

    //find all of the custom textboxes and reset them to default
    const inputs = document.querySelectorAll("input[type='number'][id^='customValue'], input[type='number'][id^='customAmount']");
    inputs.forEach(input => {
        input.value = null;
    });

    resetTotals();    
}

function resetTotals(){
    gemTotalElements.forEach(id => {
        document.getElementById(id).innerText = "";
    });

    //reset custom labels too
    let customTotals = document.querySelectorAll("label[id^='customGemsTotal']");
    customTotals.forEach(total =>{
        total.innerText = "";
    });
    document.getElementById('grandTotal').innerText = "";
}


// Function to add a new custom row
function addCustomRow() {
    customRowCount++;
    const table = document.getElementById("customRowsPlaceholder").parentNode;
    
    // Create a new row element
    const newRow = document.createElement("tr");
    newRow.id = `customRow${customRowCount}`;
    
    // Create cells for custom input (placeholder "insert custom here"), amount input, and total
    const customInputCell = document.createElement("td");
    customInputCell.innerHTML = `<input type="number" min="0" id="customValue${customRowCount}" placeholder="Insert custom here" onblur="checkAndUpdateCustom(${customRowCount})">`;
    
    const customAmountCell = document.createElement("td");
    customAmountCell.innerHTML = `<input type="number" min="0" id="customAmount${customRowCount}" placeholder="0" onblur="checkAndUpdateCustom(${customRowCount})">`;
    
    const totalCell = document.createElement("td");
    totalCell.innerHTML = `<label id="customGemsTotal${customRowCount}"></label>`;
    
    // Append cells to the new row
    newRow.appendChild(customInputCell);
    newRow.appendChild(customAmountCell);
    newRow.appendChild(totalCell);
    
    // Insert the new row before the custom rows placeholder
    table.insertBefore(newRow, document.getElementById("customRowsPlaceholder"));
}

// Function to update the total for a custom row and check if a new row should be added
function checkAndUpdateCustom(rowNumber) {
    const customValue = document.getElementById(`customValue${rowNumber}`).value || 0;
    const customAmount = document.getElementById(`customAmount${rowNumber}`).value || 0;
    const total = customValue * customAmount;
    
    document.getElementById(`customGemsTotal${rowNumber}`).innerText = total;

    // If both inputs have values, add a new custom row
    if (customValue > 0 || customAmount > 0) {
        // Only add a new row if no other custom rows are empty
        const lastRowValue = document.getElementById(`customValue${customRowCount}`).value || 0;
        const lastRowAmount = document.getElementById(`customAmount${customRowCount}`).value || 0;

        if (lastRowValue > 0 || lastRowAmount > 0) {
            addCustomRow();
        }
    }
    
    // Recalculate the grand total whenever a custom row changes
    calculateGrandTotal();
}

// Function to calculate the grand total including custom rows
function calculateGrandTotal() {
    let grandTotal = 0;

    // Loop through all gem inputs and sum them
    const inputs = document.querySelectorAll("input[type='number']");
    inputs.forEach(input => {
        const value = parseInt(input.value || 0, 10);
        const id = input.id;

        // Check if the input belongs to a custom row (A * B)
        if (id.startsWith("customValue")) {
            const rowNumber = id.replace("customValue", "");
            const customAmount = parseInt(document.getElementById(`customAmount${rowNumber}`).value || 0, 10);
            grandTotal += value * customAmount;
        }
    });

    gemTotalElements.forEach(id => {
        const resultValue = parseFloat(document.getElementById(id).innerText.replace(/,/g,'')) || 0;
        grandTotal += resultValue;
    });

    // Update the grand total display
    document.getElementById("grandTotal").innerText = grandTotal;
}
