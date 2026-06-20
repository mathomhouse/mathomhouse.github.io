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

    renderPetPortrait(1);
    renderPetPortrait(2);
  }

  // ─── Animated beast headshots ───────────────────────────────────────────────
  // Second word of the species option → asset basename. Lynx is the exception:
  // always gold, and its name (no color prefix) maps straight to Fluffynx.
  const beastNameMap = {
    eagle: 'Tornadeagle', bear: 'Grizzroar', deer: 'Gleamdeer', ray: 'Dreadray',
    kangaroo: 'Bounceroo', horse: 'Swiftsteed', lion: 'Dusklion',
    egret: 'Crestegret', lynx: 'Fluffynx'
  };
  const petElements = ['Fire', 'Ground', 'Water', 'Wind'];
  const petRotators = {};

  function getBeastInfo(petNumber) {
    const sel = document.getElementById(`species${petNumber}`);
    if (!sel || sel.selectedIndex < 0) return null;
    const text = sel.options[sel.selectedIndex].text.trim();
    let color, beastWord;
    if (/lynx/i.test(text)) {
      color = 'gold';
      beastWord = 'lynx';
    } else {
      const words = text.split(/\s+/);
      color = (words[0] || '').toLowerCase();
      beastWord = (words[1] || '').toLowerCase();
    }
    const beast = beastNameMap[beastWord];
    if (!beast) return null;
    return { color: color === 'purple' ? 'purple' : 'gold', beast };
  }

  function renderPetPortrait(petNumber) {
    const wrap = document.getElementById(`petPortrait${petNumber}`);
    if (!wrap) return;
    if (petRotators[petNumber]) {
      clearInterval(petRotators[petNumber]);
      delete petRotators[petNumber];
    }

    const info = getBeastInfo(petNumber);
    if (!info) {
      wrap.innerHTML = '';
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = '';
    wrap.className = `pet-portrait-wrap ${info.color}`;
    const src = el => `assets/beast-icons/${info.beast}_${el}_headshot.png`;
    let idx = Math.floor(Math.random() * petElements.length);
    wrap.innerHTML = `<img class="pet-portrait" src="${src(petElements[idx])}" alt="${info.beast}" loading="lazy">`;
    const img = wrap.querySelector('.pet-portrait');

    // Rotate through the 4 element headshots; skip while hidden/off-screen.
    const card = document.getElementById(`comparison-result${petNumber}`);
    petRotators[petNumber] = setInterval(() => {
      if (document.hidden || !card.classList.contains('in-view')) return;
      idx = (idx + 1) % petElements.length;
      img.style.opacity = '0';
      setTimeout(() => { img.src = src(petElements[idx]); img.style.opacity = '1'; }, 300);
    }, 3000);

    observePetPortraits();
  }

  // Animation gating: pause ring spin off-screen and while tab is backgrounded.
  const petCardObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
  }, { rootMargin: '120px' });
  function observePetPortraits() {
    ['comparison-result1', 'comparison-result2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) petCardObserver.observe(el);
    });
  }
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('anims-paused', document.hidden);
  });

  function resetForm() {
    document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
    document.querySelectorAll('select').forEach(select => select.selectedIndex = 0);
    document.getElementById("result1").textContent = '';
    document.getElementById("result2").textContent = '';
    document.getElementById("comparison-result1").style.display = "none";
    document.getElementById("comparison-result2").style.display = "none";

    [1, 2].forEach(n => {
      if (petRotators[n]) { clearInterval(petRotators[n]); delete petRotators[n]; }
      const wrap = document.getElementById(`petPortrait${n}`);
      if (wrap) { wrap.innerHTML = ''; wrap.style.display = 'none'; }
    });
  }