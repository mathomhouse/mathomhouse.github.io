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
    document.getElementById('result').innerHTML = `Your total VIT is: ${result}`;
}

function resetVit(){
    document.getElementById('vitLargeCapsule').value = 0;
    document.getElementById('vitSmallCapsule').value = 0;
    document.getElementById('vitPlus50').value = 0;
    document.getElementById('vitPlus10').value = 0;
    document.getElementById('vitFlower').value = 0;
    document.getElementById('vitHeart').value = 0;

    // Clear the result
    document.getElementById('result').innerHTML = '';
}