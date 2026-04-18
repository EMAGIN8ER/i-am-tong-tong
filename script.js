// Game State
const state = {
    coins: 0,
    reputation: 0,
    inventory: [
        { id: 'glop', name: 'Glop', icon: '🧪', price: 15 },
        { id: 'battery', name: 'Battery', icon: '🔋', price: 30 },
        { id: 'spice', name: 'Spice', icon: '🌶️', price: 50 },
        { id: 'circuit', name: 'Circuit', icon: '💾', price: 75 },
        { id: 'rocket', name: 'Rocket', icon: '🚀', price: 150 },
        { id: 'balloons', name: 'Balloons', icon: '🎈', price: 40 },
        { id: 'fries', name: 'Fries', icon: '🍟', price: 60 },
        { id: 'fruit', name: 'Fruit', icon: '🍎', price: 55 },
        { id: 'neuralink', name: 'Neuralink', icon: '🧠', price: 500 }
    ],
    upgrades: [
        { id: 'marketing', name: 'Better Marketing', cost: 100, currency: 'coins', level: 0, max: 5, description: 'Increases customer spawn rate' },
        { id: 'speed-service', name: 'Tong Speed', cost: 150, currency: 'coins', level: 0, max: 5, description: 'Increases tips from happy customers' },
        { id: 'business-license', name: 'Business License', cost: 10, currency: 'rep', level: 0, max: 5, description: 'Permanent 20% boost to all earnings' },
        { id: 'popularity', name: 'Popularity Boost', cost: 25, currency: 'rep', level: 0, max: 1, description: 'Maximum customer capacity increased' }
    ],
    activeCustomers: [],
    maxCustomers: 4,
    spawnRate: 5000,
    patienceTime: 5000,
    currentPatience: 5000,
    lastFrontCustomerId: null,
    hasFoodPermit: false,
    hasNeuralPermit: false,
    moonMultiplier: 1.0,
    starMultiplier: 1.0,
    shopTimer: 150, // 2m 30s
    shopItems: [],
    inventoryPotions: [], // { id, name, boost, type, count }
    activeBoosts: [], // { id, name, boost, type, timeLeft }
    tipJarAmount: 0,
    tipJarMax: 2500
};

const starItemPool = [
    { id: 'rusty-token', name: 'Rusty Token', rarity: 'common', cost: 2, boost: 0.1, type: 'moon' },
    { id: 'neon-wire', name: 'Neon Wire', rarity: 'common', cost: 5, boost: 0.2, type: 'moon' },
    { id: 'cyber-gear', name: 'Cyber Gear', rarity: 'uncommon', cost: 12, boost: 0.4, type: 'moon' },
    { id: 'slick-fluid', name: 'Slick Fluid', rarity: 'uncommon', cost: 20, boost: 0.6, type: 'moon' },
    { id: 'turbo-chip', name: 'Turbo Chip', rarity: 'rare', cost: 40, boost: 1.0, type: 'moon' },
    { id: 'void-cell', name: 'Void Cell', rarity: 'rare', cost: 75, boost: 1.5, type: 'moon' },
    { id: 'quant-core', name: 'Quantum Core', rarity: 'epic', cost: 150, boost: 2.5, type: 'moon' },
    { id: 'dark-matter', name: 'Dark Matter', rarity: 'epic', cost: 300, boost: 4.0, type: 'moon' },
    { id: 'lunar-ess', name: 'Lunar Essence', rarity: 'prismatic', cost: 750, boost: 5.0, type: 'moon' },
    { id: 'celest-star', name: 'Celestial Star', rarity: 'prismatic', cost: 1500, boost: 0.10, type: 'dual' }
];

// DOM Elements
const coinDisplay = document.querySelector('#coin-display .value');
const repDisplay = document.querySelector('#reputation-display .value');
const potCountDisplay = document.getElementById('pot-count');
const customerArea = document.getElementById('customer-area');
const inventoryItems = () => document.querySelectorAll('.inventory-item');
const upgradeModal = document.getElementById('upgrade-modal');
const upgradeMenuBtn = document.getElementById('upgrade-menu-btn');
const closeModalBtn = document.getElementById('close-modal');
const upgradeList = document.querySelector('.upgrade-list');
const notifications = document.getElementById('notifications');
const starShopModal = document.getElementById('star-shop-modal');
const inventoryModal = document.getElementById('inventory-modal');

// Initialization
function init() {
    updateUI();
    startSpawner();
    refreshStarShop();
    setupEventListeners();
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    coinDisplay.textContent = state.coins;
    repDisplay.textContent = state.reputation;
    const totalPots = state.inventoryPotions.reduce((acc, p) => acc + p.count, 0);
    if (potCountDisplay) potCountDisplay.textContent = totalPots;

    // Tip Jar UI
    const tipFill = document.getElementById('tip-jar-fill');
    const tipValue = document.getElementById('tip-jar-value');
    const claimBtn = document.getElementById('claim-tip-btn');
    if (tipFill && tipValue) {
        const perc = (state.tipJarAmount / state.tipJarMax) * 100;
        tipFill.style.width = `${perc}%`;
        tipValue.textContent = `${Math.floor(state.tipJarAmount)}/${state.tipJarMax}`;
        claimBtn.disabled = state.tipJarAmount < state.tipJarMax;
    }
}

function tongSay(text) {
    // Tong Tong is on vacation
}

function showNotification(text) {
    const div = document.createElement('div');
    div.className = 'notification';
    div.textContent = text;
    notifications.appendChild(div);
    setTimeout(() => div.remove(), 2000);
}

// Customer Management
const customerTypes = [
    { name: 'Cyberpunk', icon: '🧑‍🎤' },
    { name: 'Robot', icon: '🤖' },
    { name: 'Alien', icon: '👽' },
    { name: 'Merchant', icon: '🧔' },
    { name: 'Scientist', icon: '👨‍🔬' },
    { name: 'VIP', icon: '🤴', isVIP: true }
];


function spawnCustomer() {
    if (state.activeCustomers.length >= state.maxCustomers) return;

    const rand = Math.random();
    let type;
    let isOrderAll = false;

    if (rand < 0.005) {
        // Super VIP (0.5%)
        type = customerTypes.find(t => t.isVIP);
        isOrderAll = true;
    } else if (rand < 0.025) {
        // Regular VIP (2% - making it 2.5% total for VIP class)
        type = customerTypes.find(t => t.isVIP);
    } else {
        type = customerTypes[Math.floor(Math.random() * (customerTypes.length - 1))];
    }
    
    let item;
    let remainingOrders = null;

    if (isOrderAll) {
        remainingOrders = state.inventory.filter(i => {
            if (i.id === 'fries' || i.id === 'fruit') return state.hasFoodPermit;
            if (i.id === 'neuralink') return state.hasNeuralPermit;
            return true;
        }).map(i => ({...i}));
        item = { icon: '📦', name: 'Bulk Order', price: remainingOrders.reduce((acc, i) => acc + i.price, 0) };
    } else if (type.isVIP) {
        const unlockedItems = state.inventory.filter(i => {
            if (i.id === 'fries' || i.id === 'fruit') return state.hasFoodPermit;
            if (i.id === 'neuralink') return state.hasNeuralPermit;
            return true;
        });
        unlockedItems.sort((a, b) => b.price - a.price);
        item = unlockedItems[0];
    } else if (state.hasNeuralPermit && Math.random() < 0.025) {
        item = state.inventory.find(i => i.id === 'neuralink');
    } else {
        const availableItems = state.inventory.filter(i => {
            if (i.id === 'neuralink') return false;
            if (i.id === 'fries' || i.id === 'fruit') return state.hasFoodPermit;
            return true;
        });
        item = availableItems[Math.floor(Math.random() * availableItems.length)];
    }
    
    const id = Date.now();
    const customer = {
        id,
        type,
        order: item,
        entryTime: Date.now(),
        isOrderAll,
        remainingOrders
    };

    state.activeCustomers.push(customer);
    renderCustomer(customer);
}

function renderCustomer(customer) {
    const div = document.createElement('div');
    div.className = 'customer';
    if (customer.order.id === 'neuralink') div.classList.add('rare-order');
    if (customer.type.isVIP) div.classList.add('vip-customer');
    
    div.id = `customer-${customer.id}`;
    const bubbleClass = customer.type.isVIP ? 'vip-bubble' : (customer.order.id === 'neuralink' ? 'rare-bubble' : '');
    
    let bubbleContent = `<span>I need ${customer.order.icon}</span>`;
    if (customer.isOrderAll) {
        bubbleContent = `<div class="bulk-icons">${customer.remainingOrders.map(o => `<span>${o.icon}</span>`).join('')}</div>`;
    }

    div.innerHTML = `
        <div class="anger-meter">
            <div class="anger-fill"></div>
        </div>
        <div class="order-bubble ${bubbleClass}">
            ${bubbleContent}
        </div>
        <div class="customer-avatar">${customer.type.icon}</div>
    `;
    customerArea.appendChild(div);
    updateQueue();
}

function updateQueue() {
    state.activeCustomers.forEach((customer, index) => {
        const el = document.getElementById(`customer-${customer.id}`);
        if (el) {
            const z = index * -100;
            const y = index * -20;
            const s = 1 - (index * 0.05);
            el.style.transform = `translateX(-50%) translateZ(${z}px) translateY(${y}px) scale(${s})`;
            el.style.zIndex = 100 - index;
            el.style.opacity = index > 5 ? '0' : '1';
        }
    });
}

let lastTime = 0;
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    updatePatience(deltaTime);
    updateShopTimer(deltaTime);
    updateActiveBoosts(deltaTime);
    requestAnimationFrame(gameLoop);
}

function updateActiveBoosts(dt) {
    if (state.activeCustomers.length > 0) {
        // Only update if needed or every frame for timers
    }
    
    let expired = false;
    for (let i = state.activeBoosts.length - 1; i >= 0; i--) {
        state.activeBoosts[i].timeLeft -= dt / 1000;
        if (state.activeBoosts[i].timeLeft <= 0) {
            state.activeBoosts.splice(i, 1);
            expired = true;
        }
    }

    if (expired) recalculateMultipliers();
    renderActiveBoosts();
}

function recalculateMultipliers() {
    state.moonMultiplier = 1.0;
    state.starMultiplier = 1.0;
    
    state.activeBoosts.forEach(boost => {
        if (boost.type === 'moon') {
            state.moonMultiplier += boost.boost;
        } else {
            state.moonMultiplier += 0.1; // 10% from celestial
            state.starMultiplier += 0.1; // 10% from celestial
        }
    });
}

function updateShopTimer(dt) {
    state.shopTimer -= dt / 1000;
    if (state.shopTimer <= 0) {
        state.shopTimer = 150;
        refreshStarShop();
        showNotification("Shop Stock Refreshed!");
    }
    
    // Update Timer UI
    const mins = Math.floor(state.shopTimer / 60);
    const secs = Math.floor(state.shopTimer % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    document.getElementById('shop-timer').textContent = timeStr;
    const modalTimer = document.getElementById('shop-modal-timer');
    if (modalTimer) modalTimer.textContent = timeStr;
}

function refreshStarShop() {
    state.shopItems = starItemPool.map(item => {
        let maxQty;
        switch(item.rarity) {
            case 'prismatic': maxQty = Math.random() < 0.1 ? 1 : 0; break;
            case 'epic': maxQty = Math.random() < 0.3 ? 1 : 0; break;
            case 'rare': maxQty = Math.floor(Math.random() * 2); break;
            case 'uncommon': maxQty = Math.floor(Math.random() * 3); break;
            default: maxQty = Math.floor(Math.random() * 4) + 1; break;
        }
        return { ...item, quantity: maxQty, soldCount: 0 };
    });
    renderStarShop();
}

function updatePatience(dt) {
    if (state.activeCustomers.length === 0) {
        state.lastFrontCustomerId = null;
        return;
    }

    const frontCustomer = state.activeCustomers[0];

    if (state.lastFrontCustomerId !== frontCustomer.id) {
        state.lastFrontCustomerId = frontCustomer.id;
        state.currentPatience = state.patienceTime;
    }

    state.currentPatience -= dt;

    const el = document.getElementById(`customer-${frontCustomer.id}`);
    if (el) {
        const fill = el.querySelector('.anger-fill');
        if (fill) {
            const percentage = (state.currentPatience / state.patienceTime) * 100;
            fill.style.width = `${Math.max(0, percentage)}%`;
            if (percentage < 30) fill.style.background = '#ff4b2b';
            else if (percentage < 60) fill.style.background = '#ffb347';
            else fill.style.background = '#00f2ff';
        }
    }

    if (state.currentPatience <= 0) {
        state.reputation = Math.max(0, state.reputation - 1);
        showNotification("Too slow! Customer left.");
        removeCustomer(frontCustomer.id, true);
        updateUI();
        tongSay("They couldn't wait any longer...");
        state.lastFrontCustomerId = null;
    }
}

function startSpawner() {
    setInterval(() => {
        spawnCustomer();
    }, state.spawnRate - (state.upgrades.find(u => u.id === 'marketing').level * 700));
}

// Gameplay Logic
function fulfillOrder(itemId) {
    if (state.activeCustomers.length === 0) return;

    const firstCustomer = state.activeCustomers[0];
    
    if (firstCustomer.isOrderAll) {
        const itemIdx = firstCustomer.remainingOrders.findIndex(o => o.id === itemId);
        if (itemIdx !== -1) {
            firstCustomer.remainingOrders.splice(itemIdx, 1);
            // Update bubble
            const el = document.getElementById(`customer-${firstCustomer.id}`);
            const bubble = el.querySelector('.order-bubble');
            bubble.innerHTML = `<div class="bulk-icons">${firstCustomer.remainingOrders.map(o => `<span>${o.icon}</span>`).join('')}</div>`;
            
            if (firstCustomer.remainingOrders.length === 0) {
                // Done!
                completeFulfillment(firstCustomer);
            }
        } else {
            wrongOrder();
        }
        return;
    }

    if (firstCustomer.order.id === itemId) {
        completeFulfillment(firstCustomer);
    } else {
        wrongOrder();
    }
}

function wrongOrder() {
    const firstCustomer = state.activeCustomers[0];
    state.reputation = Math.max(0, state.reputation - 1);
    showNotification(`Wrong item! Reputation -1`);
    removeCustomer(firstCustomer.id, true);
    updateUI();
    tongSay("Oops! Wrong item.");
}

function completeFulfillment(firstCustomer) {
    const basePrice = firstCustomer.order.price;
    const tipLevel = state.upgrades.find(u => u.id === 'speed-service').level;
    const licenseLevel = state.upgrades.find(u => u.id === 'business-license').level;
    
    let totalEarned = basePrice + (tipLevel * 5);
    totalEarned = Math.floor(totalEarned * (1 + (licenseLevel * 0.2)) * state.moonMultiplier);

    state.coins += totalEarned;
    state.reputation += Math.ceil(1 * state.starMultiplier);
    
    // Tip Logic
    let tip = 0;
    if (firstCustomer.type.isVIP) {
        tip = basePrice * 5;
        showNotification(`${firstCustomer.isOrderAll ? 'SUPER ' : ''}VIP Tip: +${tip} Moon Tokens!`);
    } else if (Math.random() < 0.2) {
        tip = Math.floor(basePrice * 0.25);
        showNotification(`Tip: +${tip} Moon Tokens!`);
    }

    if (tip > 0) {
        state.tipJarAmount = Math.min(state.tipJarMax, state.tipJarAmount + tip);
        const jarIcon = document.getElementById('tip-jar-icon');
        if (jarIcon) {
            jarIcon.classList.remove('jar-shaking');
            void jarIcon.offsetWidth; // Trigger reflow
            jarIcon.classList.add('jar-shaking');
        }
    }

    showNotification(`+${totalEarned} Moon Tokens!`);
    removeCustomer(firstCustomer.id);
    updateUI();
    tongSay("Excellent service!");
}

function removeCustomer(id, wasAngry = false) {
    const idx = state.activeCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
        state.activeCustomers.splice(idx, 1);
        const el = document.getElementById(`customer-${id}`);
        if (el) {
            if (wasAngry) el.style.transform = 'translateX(-150%) translateY(-100px) rotate(-30deg)';
            else el.style.transform = 'translateX(150%) translateY(-100px) scale(0.8)';
            el.style.opacity = '0';
            setTimeout(() => el.remove(), 600);
        }
        updateQueue();
    }
}

// Upgrade System
function openUpgrades() {
    renderUpgrades();
    upgradeModal.classList.remove('hidden');
}

function renderUpgrades() {
    upgradeList.innerHTML = '';
    state.upgrades.forEach(upgrade => {
        const div = document.createElement('div');
        div.className = 'upgrade-item';
        const currencyIcon = upgrade.currency === 'coins' ? '🪙' : '⭐';
        const currentCurrency = upgrade.currency === 'coins' ? state.coins : state.reputation;
        
        div.innerHTML = `
            <div class="upgrade-info">
                <h3>${upgrade.name} (Lvl ${upgrade.level}/${upgrade.max})</h3>
                <p>${upgrade.description}</p>
            </div>
            <button class="buy-btn" ${currentCurrency < upgrade.cost || upgrade.level >= upgrade.max ? 'disabled' : ''} onclick="buyUpgrade('${upgrade.id}')">
                ${upgrade.level >= upgrade.max ? 'MAX' : `${upgrade.cost} ${currencyIcon}`}
            </button>
        `;
        upgradeList.appendChild(div);
    });
}

window.buyUpgrade = (id) => {
    const upgrade = state.upgrades.find(u => u.id === id);
    const currentCurrency = upgrade.currency === 'coins' ? state.coins : state.reputation;

    if (currentCurrency >= upgrade.cost && upgrade.level < upgrade.max) {
        if (upgrade.currency === 'coins') state.coins -= upgrade.cost;
        else state.reputation -= upgrade.cost;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.8);
        if (id === 'popularity' && upgrade.level === 1) state.maxCustomers = 6;
        updateUI();
        renderUpgrades();
        showNotification(`Upgraded: ${upgrade.name}!`);
        tongSay("A fine investment!");
    }
};

function openStarShop() {
    renderStarShop();
    starShopModal.classList.remove('hidden');
}

function openInventory() {
    renderInventory();
    renderActiveBoosts();
    inventoryModal.classList.remove('hidden');
}

function renderStarShop() {
    const list = document.getElementById('star-item-list');
    if (!list) return;
    list.innerHTML = '';
    state.shopItems.forEach(item => {
        const div = document.createElement('div');
        const isOutOfStock = item.quantity === 0;
        const isSoldOut = !isOutOfStock && item.soldCount >= item.quantity;
        
        div.className = `star-shop-item rarity-${item.rarity} ${isSoldOut || isOutOfStock ? 'sold' : ''}`;
        let boostDesc = item.type === 'moon' ? `+${item.boost}x Moon Boost` : `+10% Moon & Star Boost`;
        
        div.innerHTML = `
            <div class="item-rarity">${item.rarity}</div>
            <div class="item-main">
                <h3>${item.name} <span class="qty-badge">x${item.quantity - item.soldCount}</span></h3>
                <p>${boostDesc}</p>
            </div>
            <button class="buy-star-btn" ${(state.reputation < item.cost || isSoldOut || isOutOfStock) ? 'disabled' : ''} onclick="buyStarItem('${item.id}')">
                ${isOutOfStock ? 'OUT OF STOCK' : (isSoldOut ? 'SOLD OUT' : `${item.cost} ⭐`)}
            </button>
        `;
        list.appendChild(div);
    });
}

window.buyStarItem = (id) => {
    const item = state.shopItems.find(i => i.id == id);
    if (!item || item.soldCount >= item.quantity) return;

    if (state.reputation >= item.cost) {
        state.reputation -= item.cost;
        item.soldCount++;
        
        // Add to inventory
        const existing = state.inventoryPotions.find(p => p.id === item.id);
        if (existing) {
            existing.count++;
        } else {
            state.inventoryPotions.push({ ...item, count: 1 });
        }

        updateUI();
        renderStarShop();
        renderInventory();
        showNotification(`Bought ${item.name}! Check your inventory.`);
    }
};

function consumePotion(id) {
    const potionIndex = state.inventoryPotions.findIndex(p => p.id === id);
    const potion = state.inventoryPotions[potionIndex];
    if (potion && potion.count > 0) {
        potion.count--;
        if (potion.count <= 0) state.inventoryPotions.splice(potionIndex, 1);
        
        state.activeBoosts.push({ ...potion, timeLeft: 600 }); // 10 minutes
        recalculateMultipliers();
        renderInventory();
        renderActiveBoosts();
        showNotification(`Activated ${potion.name}! 10 minute boost started.`);
    }
}

function renderInventory() {
    const list = document.getElementById('inventory-item-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (state.inventoryPotions.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 20px; opacity: 0.5;">No potions in inventory.</p>';
        return;
    }

    state.inventoryPotions.forEach(potion => {
        const div = document.createElement('div');
        div.className = `star-shop-item rarity-${potion.rarity}`;
        let boostDesc = potion.type === 'moon' ? `+${potion.boost}x Moon Boost` : `+10% Moon & Star Boost`;
        
        div.innerHTML = `
            <div class="item-rarity">${potion.rarity}</div>
            <div class="item-main">
                <h3>${potion.name} <span class="qty-badge">x${potion.count}</span></h3>
                <p>${boostDesc}</p>
            </div>
            <button class="buy-star-btn" onclick="consumePotion('${potion.id}')">
                CONSUME
            </button>
        `;
        list.appendChild(div);
    });
}

function renderActiveBoosts() {
    // Render in Inventory Modal
    const list = document.getElementById('active-boosts-list');
    if (list && !inventoryModal.classList.contains('hidden')) {
        list.innerHTML = '';
        state.activeBoosts.forEach(boost => {
            const mins = Math.floor(boost.timeLeft / 60);
            const secs = Math.floor(boost.timeLeft % 60);
            const div = document.createElement('div');
            div.className = `active-boost-tag rarity-${boost.rarity}`;
            div.innerHTML = `
                <strong>${boost.name}</strong>
                <span>${mins}:${secs.toString().padStart(2, '0')}</span>
            `;
            list.appendChild(div);
        });
    }

    // Render in HUD (Optimized)
    const hud = document.getElementById('active-boosts-hud');
    if (hud) {
        // If count changed, rebuild
        if (hud.children.length !== state.activeBoosts.length) {
            hud.innerHTML = '';
            state.activeBoosts.forEach((boost, i) => {
                const icon = boost.type === 'moon' ? '🌕' : '⭐';
                const div = document.createElement('div');
                div.className = 'hud-boost-item';
                div.id = `hud-boost-${i}`;
                div.innerHTML = `
                    <div class="hud-boost-icon">${icon}</div>
                    <div class="hud-boost-timer">00:00</div>
                `;
                hud.appendChild(div);
            });
        }
        
        // Update just the timers
        state.activeBoosts.forEach((boost, i) => {
            const timerEl = document.querySelector(`#hud-boost-${i} .hud-boost-timer`);
            if (timerEl) {
                const mins = Math.floor(boost.timeLeft / 60);
                const secs = Math.floor(boost.timeLeft % 60);
                timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
        });
    }
}

function setupEventListeners() {
    const starShopBtn = document.getElementById('star-shop-btn');
    starShopBtn.addEventListener('click', openStarShop);
    document.getElementById('close-star-modal').addEventListener('click', () => {
        starShopModal.classList.add('hidden');
    });

    const inventoryBtn = document.getElementById('inventory-btn');
    inventoryBtn.addEventListener('click', openInventory);
    document.getElementById('close-inventory-modal').addEventListener('click', () => {
        inventoryModal.classList.add('hidden');
    });

    document.getElementById('claim-tip-btn').addEventListener('click', () => {
        if (state.tipJarAmount >= state.tipJarMax) {
            state.coins += state.tipJarAmount;
            state.tipJarAmount = 0;
            updateUI();
            showNotification("Tip Jar Claimed! +2500 Moon Tokens!");
        }
    });

    document.getElementById('inventory-bar').addEventListener('click', (e) => {
        const item = e.target.closest('.inventory-item');
        if (item) fulfillOrder(item.dataset.item);
    });

    upgradeMenuBtn.addEventListener('click', openUpgrades);
    closeModalBtn.addEventListener('click', () => upgradeModal.classList.add('hidden'));

    const foodPermitBtn = document.getElementById('food-permit-btn');
    foodPermitBtn.addEventListener('click', () => {
        if (!state.hasFoodPermit && state.coins >= 250) {
            state.coins -= 250;
            state.hasFoodPermit = true;
            foodPermitBtn.textContent = "FOOD PERMIT (OWNED)";
            foodPermitBtn.classList.add('owned');
            
            // Unlock only food items in UI
            ['fries', 'fruit'].forEach(id => {
                const el = document.querySelector(`.inventory-item[data-item="${id}"]`);
                if (el) {
                    el.classList.remove('hidden');
                    el.classList.remove('locked');
                }
            });

            updateUI();
            showNotification("Food Handlers Permit Acquired!");
            tongSay("Time to serve some space snacks!");
        } else if (!state.hasFoodPermit) {
            tongSay("I need 250 Moon Tokens for the permit.");
        }
    });

    const neuralPermitBtn = document.getElementById('neural-permit-btn');
    neuralPermitBtn.addEventListener('click', () => {
        if (!state.hasNeuralPermit && state.coins >= 500) {
            state.coins -= 500;
            state.hasNeuralPermit = true;
            neuralPermitBtn.textContent = "NEURAL PERMIT (OWNED)";
            neuralPermitBtn.classList.add('owned');
            
            const btn = document.querySelector('.inventory-item[data-item="neuralink"]');
            btn.classList.remove('hidden');
            btn.classList.remove('locked');

            updateUI();
            showNotification("Neural Permit Acquired!");
        } else if (!state.hasNeuralPermit) {
            showNotification("Need 500 Moon Tokens!");
        }
    });

    window.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key >= '1' && key <= '9') {
            const index = parseInt(key) - 1;
            const item = state.inventory[index];
            if (item) {
                if ((item.id === 'fries' || item.id === 'fruit') && !state.hasFoodPermit) return;
                if (item.id === 'neuralink' && !state.hasNeuralPermit) return;
                fulfillOrder(item.id);
            }
        }
    });
}

init();
