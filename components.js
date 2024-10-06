function generateTable() {
    const dropdown = document.getElementById('numberSelect');
    const selectedText = dropdown.options[dropdown.selectedIndex].text;  // Get the text of the selected option

    if (!selectedText || selectedText === "Select")  // Ensure a valid option is selected
    {
        document.getElementById('tableContainer').innerHTML = "";
        document.getElementById('resultLabel').innerText = "";  // Clear result label
        return;
    }

    // Use the selectedText to determine the number of rows
    const numberOfRows = selectedText - 1;  // Subtract 1 as per your requirement

    let table = "<table><thead><tr><th>Component Level</th><th>Amount</th></tr></thead><tbody>";

    for (let i = 0; i < numberOfRows; i++) {
        let inputId = `input${i + 1}`;
        table += `<tr>
                    <td>Level ${i + 1}</td>
                    <td><input type="number" id="${inputId}" name="${inputId}" min="0" /></td>
                  </tr>`;
    }

    table += "</tbody></table><br>";

    // Add the Calculate button below the table
    table += `<button id="calculateButton" onclick="calculateTotal()">Calculate</button>`;
    //add reset button
    table += `<button id="resetButton" onclick="resetPage()">Reset</button>`;
    document.getElementById('tableContainer').innerHTML = table;
}

function calculateTotal() {
    let total = 0;
    const inputs = document.querySelectorAll('input[type="number"]');

    for (let i = 0; i < inputs.length; i++) {
        const value = parseFloat(inputs[i].value) || 0; // Use 0 if no value is entered
        total += value * (3 ** i);
    }
    const dropdown = document.getElementById('numberSelect');
    var x = dropdown.options[dropdown.selectedIndex].value - total;
    var y = x / 9;

    document.getElementById('resultLabel').innerHTML = `Total level 1 Components Needed: <b>${x}</b> <br>Total level 3 Components Needed: <b>${y}</b> `;
}

function resetPage(){
    document.getElementById('tableContainer').innerHTML = '';
    document.getElementById('resultLabel').innerHTML = '';
    document.getElementById('numberSelect').selectedIndex = 0;   
}
