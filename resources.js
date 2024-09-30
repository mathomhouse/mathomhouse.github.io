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
    (v_500kFood * v_500Foodvalue) +
    (v_100kFood * v_100kFoodvalue) +
    (v_50kFood * v_50kFoodvalue) +
    (v_10kFood * v_10kFoodvalue) +
    (v_500Food * v_500Foodvalue);

    const oilResult = 
    v_openOil +
    (v_1milOil * v_1milOilvalue) + 
    (v_500kOil * v_500Oilvalue) +
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