 function showCalculator() {
    const selectedCalculator = document.getElementById("calculator-type").value;

    const titanGearCalculator = document.getElementById("titan-gear-calculator");
    const htChipsCalculator = document.getElementById("ht-chips-calculator");

    if (selectedCalculator === "titan-gear") {
        titanGearCalculator.style.display = "block";
        htChipsCalculator.style.display = "none";
    } else if (selectedCalculator === "ht-chips") {
        titanGearCalculator.style.display = "none";
        htChipsCalculator.style.display = "block";
    }
     else { titanGearCalculator.style.display = "none";
        htChipsCalculator.style.display = "none";

     }
}

 function compareGear() {
    // Gear 1 stats
    const gear1DamageIncrease = parseFloat(document.getElementById('gear1-damage-increase').value) || 0;
    const gear1Attack = parseFloat(document.getElementById('gear1-attack').value) || 0;
    const gear1Defense = parseFloat(document.getElementById('gear1-defense').value) || 0;
    const gear1HP = parseFloat(document.getElementById('gear1-hp').value) || 0;
    const gear1DamageDecrease = parseFloat(document.getElementById('gear1-damage-decrease').value) || 0;

    // Gear 2 stats
    const gear2DamageIncrease = parseFloat(document.getElementById('gear2-damage-increase').value) || 0;
    const gear2Attack = parseFloat(document.getElementById('gear2-attack').value) || 0;
    const gear2Defense = parseFloat(document.getElementById('gear2-defense').value) || 0;
    const gear2HP = parseFloat(document.getElementById('gear2-hp').value) || 0;
    const gear2DamageDecrease = parseFloat(document.getElementById('gear2-damage-decrease').value) || 0;

    // Calculate offense and defense values for both gear
    const gear1Offense = (gear1DamageIncrease * 9) + gear1Attack;
    const gear2Offense = (gear2DamageIncrease * 9) + gear2Attack;

    const gear1DefenseScore = (gear1Defense * 17) + gear1HP + (gear1DamageDecrease * 6);
    const gear2DefenseScore = (gear2Defense * 17) + gear2HP + (gear2DamageDecrease * 6);

    // Display calculated stats based on input
    let result = '';

    const gear1HasOffense = gear1DamageIncrease || gear1Attack;
    const gear2HasOffense = gear2DamageIncrease || gear2Attack;
    const gear1HasDefense = gear1Defense || gear1HP || gear1DamageDecrease;
    const gear2HasDefense = gear2Defense || gear2HP || gear2DamageDecrease;

    // Offense comparison
    if (gear1HasOffense || gear2HasOffense) {
        result += `Gear 1 Total Attack: ${gear1Offense.toString()}%\n`;
        result += `Gear 2 Total Attack: ${gear2Offense.toString()}%\n\n`;

        if (gear1Offense > gear2Offense) {
            result += 'Gear 1 has better offense.\n\n';
            document.getElementById('gear1-box').style.backgroundColor = '#d4edda';
            document.getElementById('gear2-box').style.backgroundColor = '';
        } else if (gear2Offense > gear1Offense) {
            result += 'Gear 2 has better offense.\n\n';
            document.getElementById('gear2-box').style.backgroundColor = '#d4edda';
            document.getElementById('gear1-box').style.backgroundColor = '';
        } else {
            result += 'Both gears have equal offense.\n\n';
            document.getElementById('gear1-box').style.backgroundColor = '';
            document.getElementById('gear2-box').style.backgroundColor = '';
        }
    }

    // Defense comparison
    if (gear1HasDefense || gear2HasDefense) {
        result += `Gear 1 Total HP: ${gear1DefenseScore.toString()}%\n`;
        result += `Gear 2 Total HP: ${gear2DefenseScore.toString()}%\n\n`;

        if (gear1DefenseScore > gear2DefenseScore) {
            result += 'Gear 1 has better defense.\n';
            document.getElementById('gear1-box').style.backgroundColor = '#d4edda';
            document.getElementById('gear2-box').style.backgroundColor = '';
        } else if (gear2DefenseScore > gear1DefenseScore) {
            result += 'Gear 2 has better defense.\n';
            document.getElementById('gear2-box').style.backgroundColor = '#d4edda';
            document.getElementById('gear1-box').style.backgroundColor = '';
        } else {
            result += 'Both gears have equal defense.\n';
            document.getElementById('gear1-box').style.backgroundColor = '';
            document.getElementById('gear2-box').style.backgroundColor = '';
        }
    }

    document.getElementById('result').textContent = result;
}

function resetValues() {
    document.getElementById('gear1-damage-increase').value = 0;
    document.getElementById('gear1-attack').value = 0;
    document.getElementById('gear1-defense').value = 0;
    document.getElementById('gear1-hp').value = 0;
    document.getElementById('gear1-damage-decrease').value = 0;

    document.getElementById('gear2-damage-increase').value = 0;
    document.getElementById('gear2-attack').value = 0;
    document.getElementById('gear2-defense').value = 0;
    document.getElementById('gear2-hp').value = 0;
    document.getElementById('gear2-damage-decrease').value = 0;

    document.getElementById('gear1-box').style.backgroundColor = '';
    document.getElementById('gear2-box').style.backgroundColor = '';
    document.getElementById('result').textContent = '';
}
function calculateHTChipsScore() {
    // Get the input values
    const def = parseFloat(document.getElementById('ht-def').value) || 0;
    const shield = parseFloat(document.getElementById('ht-shield').value) || 0;
    const dmgIncrease = parseFloat(document.getElementById('ht-dmg-increase').value) || 0;
    const dmgDecrease = parseFloat(document.getElementById('ht-dmg-decrease').value) || 0;
    const critDmg = parseFloat(document.getElementById('ht-crit-dmg').value) || 0;
    const critRate = parseFloat(document.getElementById('ht-crit-rate').value) || 0;
    const atk = parseFloat(document.getElementById('ht-atk').value) || 0;
    const hp = parseFloat(document.getElementById('ht-hp').value) || 0;

    // Apply the multipliers
    const score = (def * 15) +
                  (shield * 13) +
                  (dmgIncrease * 8) +
                  (dmgDecrease * 6) +
                  (critDmg * 4) +
                  (critRate * 2) +
                  (atk * 2) +
                  (hp * 1);

    // Display the result
    document.getElementById('ht-result').textContent = `Total Score: ${score.toFixed(2)}`;
}

function resetHTChips() {
    // Reset all input fields to zero
    document.getElementById('ht-def').value = 0;
    document.getElementById('ht-shield').value = 0;
    document.getElementById('ht-dmg-increase').value = 0;
    document.getElementById('ht-dmg-decrease').value = 0;
    document.getElementById('ht-crit-dmg').value = 0;
    document.getElementById('ht-crit-rate').value = 0;
    document.getElementById('ht-atk').value = 0;
    document.getElementById('ht-hp').value = 0;

    // Clear the result display
    document.getElementById('ht-result').textContent = '';
}


