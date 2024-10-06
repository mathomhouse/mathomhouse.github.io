const resultElementsFood = [
    'OpenFoodTotal',
    '1milFoodTotal',
    '500kFoodTotal',
    '100kFoodTotal',
    '50kFoodTotal',
    '10kFoodTotal',
    '500FoodTotal'
]

const resultElementsOil = [
    'OpenOilTotal',
    '1milOilTotal',
    '500kOilTotal',
    '100kOilTotal',
    '50kOilTotal',
    '10kOilTotal',
    '500OilTotal'
]

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
    let grandTotalFood = 0;
    resultElementsFood.forEach(id => {
        const resultValue = parseFloat(document.getElementById(id).innerText) || 0;
        grandTotal += resultValue;
    });

    // Update the grand total label
    document.getElementById('grandTotalFood').innerText = grandTotalFood.toFixed(0);


    let grandTotalOil = 0;
    resultElementsOil.forEach(id => {
        const resultValue = parseFloat(document.getElementById(id).innerText) || 0;
        grandTotalOil += resultValue;
    });

    // Update the grand total label
    document.getElementById('grandTotalOil').innerText = grandTotalOil.toFixed(0);
}

function resetTotals(){
    resultElementsFood.forEach(id => {
        document.getElementById(id).innerText = "";
    });
    document.getElementById('grandTotalFood').innerText = "";

    resultElementsOil.forEach(id => {
        document.getElementById(id).innerText = "";
    });
    document.getElementById('grandTotalOil').innerText = "";
}

window.onload = function () {
    // Define inputs and their respective multipliers and result IDs
    const Foodinputs = [
        { id: '1milFood', multiplier: 1000000, resultId: '1milFoodTotal' },
        { id: '500kFood', multiplier: 500000, resultId: '500kFoodTotal' },
        { id: '100kFood', multiplier: 100000, resultId: '100kFoodTotal' },
        { id: '50kFood', multiplier: 50000, resultId: '50kFoodTotal' },
        { id: '10kFood', multiplier: 10000, resultId: '10kFoodTotal' },
        { id: '500Food', multiplier: 500, resultId: '500FoodTotal' },
        { id: 'openFood', multiplier: 1, resultId: 'openFoodTotal' }

    ];

    // Attach the same calculateOnBlur function to the onblur event for each input
    Foodinputs.forEach(input => {
        const inputElement = document.getElementById(input.id);
        inputElement.onblur = function () {
            calculateOnBlur(inputElement, input.multiplier, input.resultId);
        };
    });
    // Define inputs and their respective multipliers and result IDs
    const Oilinputs = [
        { id: '1milOil', multiplier: 1000000, resultId: '1milOilTotal' },
        { id: '500kOil', multiplier: 500000, resultId: '500kOilTotal' },
        { id: '100kOil', multiplier: 100000, resultId: '100kOilTotal' },
        { id: '50kOil', multiplier: 50000, resultId: '50kOilTotal' },
        { id: '10kOil', multiplier: 10000, resultId: '10kOilTotal' },
        { id: '500Oil', multiplier: 500, resultId: '500OilTotal' },
        { id: 'openOil', multiplier: 1, resultId: 'openOilTotal' }
        
    ];

    // Attach the same calculateOnBlur function to the onblur event for each input
    Oilinputs.forEach(input => {
        const inputElement = document.getElementById(input.id);
        inputElement.onblur = function () {
            calculateOnBlur(inputElement, input.multiplier, input.resultId);
        };
    });
}


function calculateRSS() {
    // Retrieve input values
    const v_openFood = parseFloat(document.getElementById('openFood').value) || 0;
    const v_1milFood = parseFloat(document.getElementById('1milFood').value) || 0;
    const v_500kFood = parseFloat(document.getElementById('500kFood').value) || 0;
    const v_100kFood = parseFloat(document.getElementById('100kFood').value) || 0;
    const v_50kFood = parseFloat(document.getElementById('50kFood').value) || 0;
    const v_10kFood = parseFloat(document.getElementById('10kFood').value) || 0;
    const v_500Food = parseFloat(document.getElementById('500Food').value) || 0;
    const v_openOil = parseFloat(document.getElementById('openOil').value) || 0;
    const v_1milOil = parseFloat(document.getElementById('1milOil').value) || 0;
    const v_500kOil = parseFloat(document.getElementById('500kOil').value) || 0;
    const v_100kOil = parseFloat(document.getElementById('100kOil').value) || 0;
    const v_50kOil = parseFloat(document.getElementById('50kOil').value) || 0;
    const v_10kOil = parseFloat(document.getElementById('10kOil').value) || 0;
    const v_500Oil = parseFloat(document.getElementById('500Oil').value) || 0;

    //RSS values
    var v_1milFoodvalue = 1000000;
    var v_500kFoodvalue = 500000;
    var v_100kFoodvalue = 100000;
    var v_50kFoodvalue = 50000;
    var v_10kFoodvalue = 10000;
    var v_500Foodvalue = 500;
    var v_1milOilvalue = 1000000;
    var v_500kOilvalue = 500000;
    var v_100kOilvalue = 100000;
    var v_50kOilvalue = 50000;
    var v_10kOilvalue = 10000;
    var v_500Oilvalue = 500;


    const foodResult = 
    v_openFood +
    (v_1milFood * v_1milFoodvalue) + 
    (v_500kFood * v_500kFoodvalue) +
    (v_100kFood * v_100kFoodvalue) +
    (v_50kFood * v_50kFoodvalue) +
    (v_10kFood * v_10kFoodvalue) +
    (v_500Food * v_500Foodvalue);

    const oilResult = 
    v_openOil +
    (v_1milOil * v_1milOilvalue) + 
    (v_500kOil * v_500kOilvalue) +
    (v_100kOil * v_100kOilvalue) +
    (v_50kOil * v_50kOilvalue) +
    (v_10kOil * v_10kOilvalue) +
    (v_500Oil * v_500Oilvalue);

    var s_food = foodResult.toLocaleString("en-US");
    var s_oil = oilResult.toLocaleString("en-US");
    // Display the result
    document.getElementById('result').innerHTML = `Your total food is: <b>${s_food}</b> and total oil is: <b>${s_oil}</b> `;
}

function resetRSS(){
    document.getElementById('openFood').value = 0;
    document.getElementById('1milFood').value = 0;
    document.getElementById('500kFood').value = 0;
    document.getElementById('100kFood').value = 0;
    document.getElementById('50kFood').value = 0;
    document.getElementById('10kFood').value = 0;
    document.getElementById('500Food').value = 0;
    document.getElementById('openOil').value = 0;
    document.getElementById('1milOil').value = 0;
    document.getElementById('500kOil').value = 0;
    document.getElementById('100kOil').value = 0;
    document.getElementById('50kOil').value = 0;
    document.getElementById('10kOil').value = 0;
    document.getElementById('500Oil').value = 0;

    // Clear the result
    document.getElementById('result').innerHTML = '';
}