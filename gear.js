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
function compareHTChips() {
    // HT Chips 1 stats
    const ht1Def = parseFloat(document.getElementById('ht1-def').value) || 0;
    const ht1Shield = parseFloat(document.getElementById('ht1-shield').value) || 0;
    const ht1DmgIncrease = parseFloat(document.getElementById('ht1-dmg-increase').value) || 0;
    const ht1DmgDecrease = parseFloat(document.getElementById('ht1-dmg-decrease').value) || 0;
    const ht1CritDmg = parseFloat(document.getElementById('ht1-crit-dmg').value) || 0;
    const ht1CritRate = parseFloat(document.getElementById('ht1-crit-rate').value) || 0;
    const ht1Atk = parseFloat(document.getElementById('ht1-atk').value) || 0;
    const ht1Hp = parseFloat(document.getElementById('ht1-hp').value) || 0;

    // HT Chips 2 stats
    const ht2Def = parseFloat(document.getElementById('ht2-def').value) || 0;
    const ht2Shield = parseFloat(document.getElementById('ht2-shield').value) || 0;
    const ht2DmgIncrease = parseFloat(document.getElementById('ht2-dmg-increase').value) || 0;
    const ht2DmgDecrease = parseFloat(document.getElementById('ht2-dmg-decrease').value) || 0;
    const ht2CritDmg = parseFloat(document.getElementById('ht2-crit-dmg').value) || 0;
    const ht2CritRate = parseFloat(document.getElementById('ht2-crit-rate').value) || 0;
    const ht2Atk = parseFloat(document.getElementById('ht2-atk').value) || 0;
    const ht2Hp = parseFloat(document.getElementById('ht2-hp').value) || 0;

    // Calculate scores using the multipliers
    const score1 = (ht1Def * 15) + (ht1Shield * 13) + (ht1DmgIncrease * 8) + (ht1DmgDecrease * 6) + (ht1CritDmg * 4) + (ht1CritRate * 2) + (ht1Atk * 2) + (ht1Hp * 1);
    const score2 = (ht2Def * 15) + (ht2Shield * 13) + (ht2DmgIncrease * 8) + (ht2DmgDecrease * 6) + (ht2CritDmg * 4) + (ht2CritRate * 2) + (ht2Atk * 2) + (ht2Hp * 1);

    // Display the result
    let result = `HT Chip 1 Score: ${score1.toString()}\n`;
        result = `HT Chip 2 Score: ${score2.toString()}\n\n`;

    if (score1 > score2) {
        result += 'HT Chips 1 has the higher score.';
        document.getElementById('ht-chips1-box').style.backgroundColor = '#d4edda';
        document.getElementById('ht-chips2-box').style.backgroundColor = '';
    } else if (score2 > score1) {
        result += 'HT Chips 2 has the higher score.';
        document.getElementById('ht-chips2-box').style.backgroundColor = '#d4edda';
        document.getElementById('ht-chips1-box').style.backgroundColor = '';
    } else {
        result += 'Both HT Chips have equal scores.';
        document.getElementById('ht-chips1-box').style.backgroundColor = '';
        document.getElementById('ht-chips2-box').style.backgroundColor = '';
    }

    document.getElementById('ht-result').textContent = result;
}

function resetHTChips() {
    // Reset all input fields for both HT Chips
    document.querySelectorAll('#ht-chips1-box input, #ht-chips2-box input').forEach(input => input.value = 0);

    // Clear the result display
    document.getElementById('ht-result').textContent = '';

    // Reset background colors
    document.getElementById('ht-chips1-box').style.backgroundColor = '';
    document.getElementById('ht-chips2-box').style.backgroundColor = '';
}



