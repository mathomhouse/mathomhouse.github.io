const maxValues = {
    Suppression: 4.4,
    DMGInc: 10,
    DMGDec: 10,
    DEF: 4,
    ATK: 30,
    HP: 30,
    Elemental: 60
  };

  function calculatePet(petNumber) {
    const species = document.getElementById(`species${petNumber}`).value;
    const rarityMultiplier = (species === "gold") ? 1 : 0.92;
    const mainStat = document.getElementById(`mainStat${petNumber}`);
    const mainStatType = mainStat.options[mainStat.selectedIndex].text;
    const potential = parseFloat(document.getElementById(`potential${petNumber}`).value);
    const potentialRatio = potential / 16000;
    const mainY = maxValues[mainStat.value];
    const mainMax = potentialRatio * mainY;

    const subStats = [];
    for (let i = 1; i <= 3; i++) {
      const t = document.getElementById(`subStat${petNumber}_${i}`);
      const type = t.options[t.selectedIndex].text;
      const subY = maxValues[t.value];
      const subMax = ((potentialRatio * subY) / 2) * rarityMultiplier;
      subStats.push({ type, max: subMax });
    }

    return {
      mainStatType,
      mainMax: mainMax.toFixed(2),
      subStats
    };
  }

  function calculate() {
    const pet1 = calculatePet(1);
    const pet2 = calculatePet(2);

    const resultText1 = `
    Pet 1:<br>
    Main Stat (${pet1.mainStatType}): ${pet1.mainMax}%<br><br>
    Sub Stats:<br>
      1. ${pet1.subStats[0].type}: ${pet1.subStats[0].max.toFixed(2)}%<br>
      2. ${pet1.subStats[1].type}: ${pet1.subStats[1].max.toFixed(2)}%<br>
      3. ${pet1.subStats[2].type}: ${pet1.subStats[2].max.toFixed(2)}%<br>
    `;
        const resultText2 = `
    Pet 2:<br>
    Main Stat (${pet2.mainStatType}): ${pet2.mainMax}%<br><br>
    Sub Stats:<br>
      1. ${pet2.subStats[0].type}: ${pet2.subStats[0].max.toFixed(2)}%<br>
      2. ${pet2.subStats[1].type}: ${pet2.subStats[1].max.toFixed(2)}%<br>
      3. ${pet2.subStats[2].type}: ${pet2.subStats[2].max.toFixed(2)}%<br>
    `;
    document.getElementById("result1").innerHTML = resultText1;
    document.getElementById("result2").innerHTML = resultText2;

    document.getElementById("comparison-result1").style.display = "block";
    document.getElementById("comparison-result2").style.display = "block";
  }

  function resetForm() {
    document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
    document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    document.getElementById("result1").textContent = '';
    document.getElementById("result2").textContent = '';
    document.getElementById("comparison-result1").style.display = "none";
    document.getElementById("comparison-result2").style.display = "none";
  }