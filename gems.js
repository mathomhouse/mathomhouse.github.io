function calculateGems() {
    // Retrieve input values
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


    const result = (v_100gems * v_100gemsvalue) + (v_50gems * v_50gemsvalue) + 
    (v_60gems * v_60gemsvalue) + (v_30gems * v_30gemsvalue) + (v_20gems * v_20gemsvalue) 
     + (v_10gems * v_10gemsvalue)  + (v_120gems * v_120gemsvalue)  + (v_150gems * v_150gemsvalue) 
      + (v_200gems * v_200gemsvalue)  + (v_240gems * v_240gemsvalue)  + (v_300gems * v_300gemsvalue) 
       + (v_400gems * v_400gemsvalue)  + (v_500gems * v_500gemsvalue)  + (v_600gems * v_600gemsvalue)
        + (v_800gems * v_800gemsvalue)  + (v_1000gems * v_1000gemsvalue) + (v_1200gems * v_1200gemsvalue)
         + (v_1280gems * v_1280gemsvalue)  + (v_2000gems * v_2000gemsvalue)  + (v_2024gems * v_2024gemsvalue)
          + (v2560gems * v_2560gemsvalue)  + (v_3000gems * v_3000gemsvalue)  + (v_4000gems * v_4000gemsvalue)
           + (v_5000gems * v_5000gemsvalue)   + (v_12960gems * v_12960gemsvalue)      ;

    // Display the result
    document.getElementById('result').innerHTML = `Your total Gems are: ${result}`;
}

function resetGems(){
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
    // Clear the result
    document.getElementById('result').innerHTML = '';
}