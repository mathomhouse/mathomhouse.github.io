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
}

function calculateOnBlur(inputElement, multiplier, resultElementId) {
    const value = parseFloat(inputElement.value) || 0; // Get input value or default to 0
    const result = value * multiplier; // Multiply by the provided multiplier

    // Update the total in the respective cell (third column)
    const resultElement = document.getElementById(resultElementId);
    resultElement.innerText = result.toFixed(0); // Update with the calculated result

    // Update the grand total after each input change
    updateGrandTotal();
}

function updateGrandTotal() {
    let grandTotal = 0;
    gemTotalElements.forEach(id => {
        const resultValue = parseFloat(document.getElementById(id).innerText) || 0;
        grandTotal += resultValue;
    });

    // Update the grand total label
    document.getElementById('grandTotal').innerText = grandTotal.toFixed(0);
}

function calculateGems() {
    // Retrieve input values
    const v_opengems = parseFloat(document.getElementById('opengems').value) || 0;
    const v_100gems = parseFloat(document.getElementById('100gems').value) || 0;
    const v_50gems = parseFloat(document.getElementById('50gems').value) || 0;
    const v_60gems = parseFloat(document.getElementById('60gems').value) || 0;
    const v_30gems = parseFloat(document.getElementById('30gems').value) || 0;
    const v_20gems = parseFloat(document.getElementById('20gems').value) || 0;
    const v_10gems = parseFloat(document.getElementById('10gems').value) || 0;
    const v_120gems = parseFloat(document.getElementById('120gems').value) || 0;
    const v_150gems = parseFloat(document.getElementById('150gems').value) || 0;
    const v_200gems = parseFloat(document.getElementById('200gems').value) || 0;
    const v_240gems = parseFloat(document.getElementById('240gems').value) || 0;
    const v_300gems = parseFloat(document.getElementById('300gems').value) || 0;
    const v_400gems = parseFloat(document.getElementById('400gems').value) || 0;
    const v_500gems = parseFloat(document.getElementById('500gems').value) || 0;
    const v_600gems = parseFloat(document.getElementById('600gems').value) || 0;
    const v_800gems = parseFloat(document.getElementById('800gems').value) || 0;
    const v_1000gems = parseFloat(document.getElementById('1000gems').value) || 0;
    const v_1200gems = parseFloat(document.getElementById('1200gems').value) || 0;
    const v_1280gems = parseFloat(document.getElementById('1280gems').value) || 0;
    const v_2000gems = parseFloat(document.getElementById('2000gems').value) || 0;
    const v_2024gems = parseFloat(document.getElementById('2024gems').value) || 0;
    const v_2560gems = parseFloat(document.getElementById('2560gems').value) || 0;
    const v_3000gems = parseFloat(document.getElementById('3000gems').value) || 0;
    const v_3280gems = parseFloat(document.getElementById('3280gems').value) || 0;
    const v_4000gems = parseFloat(document.getElementById('4000gems').value) || 0;
    const v_5000gems = parseFloat(document.getElementById('5000gems').value) || 0;
    const v_12960gems = parseFloat(document.getElementById('12960gems').value) || 0;


    //VIT values
    var v_100gemsvalue = 100;
    var v_50gemsvalue = 50;
    var v_60gemsvalue = 60;
    var v_30gemsvalue = 30;
    var v_20gemsvalue = 20;
    var v_10gemsvalue = 10;
    var v_120gemsvalue = 120;
    var v_150gemsvalue = 150;
    var v_200gemsvalue = 200;
    var v_240gemsvalue = 240;
    var v_300gemsvalue = 300;
    var v_400gemsvalue = 400;
    var v_500gemsvalue = 500;
    var v_600gemsvalue = 600;
    var v_800gemsvalue = 800;
    var v_1000gemsvalue = 1000;
    var v_1200gemsvalue = 1200;
    var v_1280gemsvalue = 1280;
    var v_2000gemsvalue = 2000;
    var v_2024gemsvalue = 2024;
    var v_2560gemsvalue = 2560;
    var v_3000gemsvalue = 3000;
    var v_4000gemsvalue = 4000;
    var v_5000gemsvalue = 5000;
    var v_12960gemsvalue = 12960;


    const result =
        v_opengems +
        (v_100gems * v_100gemsvalue) +
        (v_50gems * v_50gemsvalue) +
        (v_60gems * v_60gemsvalue) +
        (v_30gems * v_30gemsvalue) +
        (v_20gems * v_20gemsvalue) +
        (v_10gems * v_10gemsvalue) +
        (v_120gems * v_120gemsvalue) +
        (v_150gems * v_150gemsvalue) +
        (v_200gems * v_200gemsvalue) +
        (v_240gems * v_240gemsvalue) +
        (v_300gems * v_300gemsvalue) +
        (v_400gems * v_400gemsvalue) +
        (v_500gems * v_500gemsvalue) +
        (v_600gems * v_600gemsvalue) +
        (v_800gems * v_800gemsvalue) +
        (v_1000gems * v_1000gemsvalue) +
        (v_1200gems * v_1200gemsvalue) +
        (v_1280gems * v_1280gemsvalue) +
        (v_2000gems * v_2000gemsvalue) +
        (v_2024gems * v_2024gemsvalue) +
        (v_2560gems * v_2560gemsvalue) +
        (v_3000gems * v_3000gemsvalue) +
        (v_4000gems * v_4000gemsvalue) +
        (v_5000gems * v_5000gemsvalue) +
        (v_12960gems * v_12960gemsvalue);

    // Display the result
    document.getElementById('result').innerHTML = `Your total Gems are: ${result}`;
}

function resetGems() {
    document.getElementById('opengems').value = 0;
    document.getElementById('100gems').value = 0;
    document.getElementById('50gems').value = 0;
    document.getElementById('60gems').value = 0;
    document.getElementById('30gems').value = 0;
    document.getElementById('20gems').value = 0;
    document.getElementById('10gems').value = 0;
    document.getElementById('120gems').value = 0;
    document.getElementById('150gems').value = 0;
    document.getElementById('200gems').value = 0;
    document.getElementById('240gems').value = 0;
    document.getElementById('300gems').value = 0;
    document.getElementById('400gems').value = 0;
    document.getElementById('500gems').value = 0;
    document.getElementById('600gems').value = 0;
    document.getElementById('800gems').value = 0;
    document.getElementById('1000gems').value = 0;
    document.getElementById('1200gems').value = 0;
    document.getElementById('1280gems').value = 0;
    document.getElementById('2000gems').value = 0;
    document.getElementById('2024gems').value = 0;
    document.getElementById('2560gems').value = 0;
    document.getElementById('3000gems').value = 0;
    document.getElementById('3280gems').value = 0;
    document.getElementById('4000gems').value = 0;
    document.getElementById('5000gems').value = 0;
    document.getElementById('12960gems').value = 0;

    resetTotals();    
}

function resetTotals(){
    gemTotalElements.forEach(id => {
        document.getElementById(id).innerText = "";
    });
    document.getElementById('grandTotal').innerText = "";
}