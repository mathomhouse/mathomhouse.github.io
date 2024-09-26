function calculateGems() {
    // Retrieve input values
    const v_100gems = parseFloat(document.getElementById('100gems').value) || 0;
    const v_50gems = parseFloat(document.getElementById('50gems').value) || 0;
    const plus50s = parseFloat(document.getElementById('vitPlus50').value) || 0;
    const plus10s = parseFloat(document.getElementById('vitPlus10').value) || 0;
    const flowers = parseFloat(document.getElementById('vitFlower').value) || 0;
    const hearts = parseFloat(document.getElementById('vitHeart').value) || 0;

    //VIT values
    var v_100gemsvalue = 100;
    var v_50gemsvalue = 50;
    var plus50Value = 50;
    var plus10Value = 10;
    var flowerValue = 30;
    var heartValue = 30;


    const result = (v_100gems * v_100gemsvalue) + (v_50gems * v_50gemsvalue);

    // Display the result
    document.getElementById('result').innerHTML = `Your total Gems are: ${result}`;
}

function resetGems(){
    document.getElementById('100gems').value = 0;
    document.getElementById('50gems').value = 0;
    document.getElementById('vitPlus50').value = 0;
    document.getElementById('vitPlus10').value = 0;
    document.getElementById('vitFlower').value = 0;
    document.getElementById('vitHeart').value = 0;

    // Clear the result
    document.getElementById('result').innerHTML = '';
}