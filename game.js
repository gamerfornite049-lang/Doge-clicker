const STORAGE_KEY = 'doge-miner-save';

const upgradeDefs = [
  { id: 'pawPower', name: 'Paw Power', description: '+1 Doge per click', baseCost: 15, type: 'click', value: 1 },
  { id: 'sniffing', name: 'Sharper Sniffing', description: '+3 Doge per click', baseCost: 60, type: 'click', value: 3 },
  { id: 'boneTap', name: 'Bone Tap', description: '+8 Doge per click', baseCost: 180, type: 'click', value: 8 },
  { id: 'trickster', name: 'Trickster Mode', description: '+20 Doge per click', baseCost: 800, type: 'click', value: 20 },
  { id: 'goldRush', name: 'Gold Rush', description: '+60 Doge per click', baseCost: 2600, type: 'click', value: 60 }
];

const buildingDefs = [
  { id: 'puppyMiner', name: 'Puppy Miner', description: 'Mines 0.5 Doges/sec', baseCost: 25, income: 0.5 },
  { id: 'dogeDrill', name: 'Doge Drill', description: 'Mines 2 Doges/sec', baseCost: 120, income: 2 },
  { id: 'coinBot', name: 'Coin Bot', description: 'Mines 8 Doges/sec', baseCost: 560, income: 8 },
  { id: 'moonRig', name: 'Moon Rig', description: 'Mines 25 Doges/sec', baseCost: 2200, income: 25 },
  { id: 'galaxyMine', name: 'Galaxy Mine', description: 'Mines 80 Doges/sec', baseCost: 8500, income: 80 }
];

const state = {
  doges: 0,
  totalDoges: 0,
  totalClicks: 0,
  clickPower: 1,
  upgrades: {},
  buildings: {},
  lastTimestamp: Date.now()
};

const dogeButton = document.getElementById('dogeButton');
const totalDogesEl = document.getElementById('totalDoges');
const dogesPerSecondEl = document.getElementById('dogesPerSecond');
const totalClicksEl = document.getElementById('totalClicks');
const upgradesList = document.getElementById('upgradesList');
const buildingsList = document.getElementById('buildingsList');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const resetBtn = document.getElementById('resetBtn');
const clickEffect = document.getElementById('clickEffect');

function initializeState() {
  for (const upgrade of upgradeDefs) {
    state.upgrades[upgrade.id] = { level: 0 };
  }

  for (const building of buildingDefs) {
    state.buildings[building.id] = { count: 0 };
  }
}

function getUpgradeCost(upgrade) {
  const saved = state.upgrades[upgrade.id];
  return Math.floor(upgrade.baseCost * Math.pow(1.48, saved.level));
}

function getBuildingCost(building) {
  const saved = state.buildings[building.id];
  return Math.floor(building.baseCost * Math.pow(1.22, saved.count));
}

function getClickPower() {
  let power = 1;

  for (const upgrade of upgradeDefs) {
    const level = state.upgrades[upgrade.id].level;
    if (level > 0) {
      power += upgrade.value * level;
    }
  }

  return power;
}

function getProductionPerSecond() {
  let total = 0;

  for (const building of buildingDefs) {
    total += state.buildings[building.id].count * building.income;
  }

  return total;
}

function formatNumber(value) {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + 'K';
  }
  return value.toFixed(value >= 10 ? 0 : 1);
}

function renderUpgrades() {
  upgradesList.innerHTML = '';

  for (const upgrade of upgradeDefs) {
    const data = state.upgrades[upgrade.id];
    const card = document.createElement('div');
    card.className = 'item-card';

    const header = document.createElement('div');
    header.className = 'item-header';

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = upgrade.name;

    const level = document.createElement('div');
    level.className = 'item-level';
    level.textContent = 'Lv ' + data.level;

    const desc = document.createElement('div');
    desc.className = 'item-description';
    desc.textContent = upgrade.description;

    const bottom = document.createElement('div');
    bottom.className = 'item-bottom';

    const cost = document.createElement('div');
    cost.className = 'item-cost';
    cost.textContent = formatNumber(getUpgradeCost(upgrade)) + ' Doges';

    const btn = document.createElement('button');
    btn.className = 'buy-btn';
    btn.textContent = 'Buy';
    btn.disabled = state.doges < getUpgradeCost(upgrade);
    btn.addEventListener('click', () => buyUpgrade(upgrade.id));

    header.append(name, level);
    bottom.append(cost, btn);
    card.append(header, desc, bottom);
    upgradesList.appendChild(card);
  }
}

function renderBuildings() {
  buildingsList.innerHTML = '';

  for (const building of buildingDefs) {
    const data = state.buildings[building.id];
    const card = document.createElement('div');
    card.className = 'item-card';

    const header = document.createElement('div');
    header.className = 'item-header';

    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = building.name;

    const count = document.createElement('div');
    count.className = 'item-level';
    count.textContent = 'x' + data.count;

    const desc = document.createElement('div');
    desc.className = 'item-description';
    desc.textContent = building.description;

    const bottom = document.createElement('div');
    bottom.className = 'item-bottom';

    const cost = document.createElement('div');
    cost.className = 'item-cost';
    cost.textContent = formatNumber(getBuildingCost(building)) + ' Doges';

    const btn = document.createElement('button');
    btn.className = 'buy-btn';
    btn.textContent = 'Hire';
    btn.disabled = state.doges < getBuildingCost(building);
    btn.addEventListener('click', () => buyBuilding(building.id));

    header.append(name, count);
    bottom.append(cost, btn);
    card.append(header, desc, bottom);
    buildingsList.appendChild(card);
  }
}

function refreshStats() {
  const clickPower = getClickPower();
  const production = getProductionPerSecond();

  totalDogesEl.textContent = formatNumber(state.doges);
  dogesPerSecondEl.textContent = formatNumber(production);
  totalClicksEl.textContent = formatNumber(state.totalClicks);
  dogeButton.title = 'Click for ' + formatNumber(clickPower) + ' Doges';

  renderUpgrades();
  renderBuildings();
}

function spawnFloatingText(value) {
  const text = document.createElement('div');
  text.className = 'floating-text';
  text.textContent = value;
  text.style.left = 50 + (Math.random() * 18 - 9) + '%';
  text.style.top = 50 + (Math.random() * 16 - 8) + '%';
  clickEffect.appendChild(text);

  setTimeout(() => {
    text.remove();
  }, 700);
}

function getClickValue() {
  return getClickPower();
}

function clickDoge() {
  const gain = getClickValue();
  state.doges += gain;
  state.totalDoges += gain;
  state.totalClicks += 1;
  spawnFloatingText('+' + formatNumber(gain));
  refreshStats();
  saveGame();
}

function buyUpgrade(id) {
  const upgrade = upgradeDefs.find((item) => item.id === id);
  const cost = getUpgradeCost(upgrade);

  if (state.doges < cost) return;

  state.doges -= cost;
  state.upgrades[id].level += 1;
  refreshStats();
  saveGame();
}

function buyBuilding(id) {
  const building = buildingDefs.find((item) => item.id === id);
  const cost = getBuildingCost(building);

  if (state.doges < cost) return;

  state.doges -= cost;
  state.buildings[id].count += 1;
  refreshStats();
  saveGame();
}

function saveGame() {
  const payload = {
    doges: state.doges,
    totalDoges: state.totalDoges,
    totalClicks: state.totalClicks,
    clickPower: state.clickPower,
    upgrades: state.upgrades,
    buildings: state.buildings,
    lastTimestamp: Date.now()
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    refreshStats();
    return;
  }

  try {
    const saved = JSON.parse(raw);

    state.doges = saved.doges || 0;
    state.totalDoges = saved.totalDoges || 0;
    state.totalClicks = saved.totalClicks || 0;
    state.clickPower = saved.clickPower || 1;

    for (const upgrade of upgradeDefs) {
      state.upgrades[upgrade.id].level = saved.upgrades?.[upgrade.id]?.level || 0;
    }

    for (const building of buildingDefs) {
      state.buildings[building.id].count = saved.buildings?.[building.id]?.count || 0;
    }

    state.lastTimestamp = saved.lastTimestamp || Date.now();
  } catch (error) {
    console.error('Failed to load save data:', error);
  }

  refreshStats();
}

function resetGame() {
  const confirmed = window.confirm('Reset your Doge Miner progress?');
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  initializeState();
  state.doges = 0;
  state.totalDoges = 0;
  state.totalClicks = 0;
  state.lastTimestamp = Date.now();
  refreshStats();
}

function gameLoop() {
  const now = Date.now();
  const deltaSeconds = (now - state.lastTimestamp) / 1000;
  state.lastTimestamp = now;

  const production = getProductionPerSecond();
  if (production > 0) {
    const gain = production * deltaSeconds;
    state.doges += gain;
    state.totalDoges += gain;
  }

  refreshStats();
}

dogeButton.addEventListener('click', clickDoge);
saveBtn.addEventListener('click', saveGame);
loadBtn.addEventListener('click', loadGame);
resetBtn.addEventListener('click', resetGame);

initializeState();
loadGame();
setInterval(gameLoop, 1000 / 20);
