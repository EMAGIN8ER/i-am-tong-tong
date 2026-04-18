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
        { id: 'popularity', name: 'Popularity Boost', cost: 25, currency: 'rep', level: 0, max: 1, description: 'Maximum customer capacity increased' },
        { id: 'bulk-service', name: 'Bulk Service License', cost: 250, currency: 'coins', level: 0, max: 1, description: 'Customers can now order 2-3 unique items at once!' },
        { id: 'clerk-speed', name: 'Clerk Speed', cost: 500, currency: 'coins', level: 0, max: 5, description: 'Store clerks process orders faster', category: 'clerk' },
        { id: 'clerk-tips', name: 'Clerk Efficiency', cost: 750, currency: 'coins', level: 0, max: 5, description: 'Clerks have a higher chance to earn tips', category: 'clerk' }
    ],
    activeCustomers: [],
    maxCustomers: 4,
    spawnRate: 2560,
    patienceTime: 5000,
    currentPatience: 5000,
    lastFrontCustomerId: null,
    hasFoodPermit: false,
    hasNeuralPermit: false,
    hasMultiOrder: false,
    moonMultiplier: 1.0,
    starMultiplier: 1.0,
    shopTimer: 150, // 2m 30s
    shopItems: [],
    inventoryPotions: [], // { id, name, boost, type, count }
    activeBoosts: [], // { id, name, boost, type, timeLeft }
    tipJarAmount: 0,
    tipJarMax: 2500,
    isMusicPlaying: false,
    
    // Day System
    day: 1,
    customersRemaining: 10,
    isDayActive: false,
    dailyCoins: 0,
    dailyRep: 0,
    dayTimeLimit: 150, // seconds
    currentDayTime: 150,
    baseSpawnRate: 3200,
    basePatience: 5000,
    lives: 3,
    
    // Store Clerks
    clerks: [],
    clerkSpeedLevel: 0,
    clerkTipLevel: 0,
    pendingClerkTutorial: false
};

const bgMusic = new Audio('background.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;

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
const tutorialModal = document.getElementById('tutorial-modal');

let tutorialStep = 0;
const tutorialSteps = [
    {
        title: "Store Clerk Training",
        body: "Welcome to Toko Tong Tong! You're the new intergalactic clerk. Let's get you up to speed.",
        icon: "🚀",
        target: null,
        pos: 'center'
    },
    {
        title: "Inventory Bar",
        body: "Serve customers by clicking items here or pressing keys 1-9. Fulfilling orders earns you Moon Tokens!",
        icon: "📦",
        target: "inventory-bar",
        pos: 'top'
    },
    {
        title: "Stats & Reputation",
        body: "Track your Moon Tokens and Star Reputation here. If a customer gets too angry and leaves, you'll lose reputation!",
        icon: "📊",
        target: "coin-display",
        pos: 'bottom'
    },
    {
        title: "Health & Overcrowding",
        body: "You have 3 lives. Be careful: If you have more than three customers OR 3 or fewer stars at the end of a day, you lose one life!",
        icon: "❤️",
        target: "lives-display",
        pos: 'bottom'
    },
    {
        title: "Operational Permits",
        body: "Purchase the Neural Permit or Food Permit here to unlock high-tier items like Brains, Fries, and Fruit.",
        icon: "📜",
        target: "food-permit-btn",
        pos: 'bottom'
    },
    {
        title: "Shop Upgrades",
        body: "Open the UPGRADES menu to increase your Speed Service, Marketing, and Business License multipliers.",
        icon: "📈",
        target: "upgrade-menu-btn",
        pos: 'bottom'
    },
    {
        title: "Star Shop & Potion Vault",
        body: "Access the Galactic Star Shop and your Potion Inventory on the left. Use potions for massive temporary boosts!",
        icon: "🧪",
        target: "star-shop-btn",
        pos: 'right'
    },
    {
        title: "The Tip Jar",
        body: "VIPs and happy customers leave tips here. Once it reaches 2500 tokens, claim it for a massive lunar payout!",
        icon: "🫙",
        target: "tip-jar-container",
        pos: 'bottom'
    }
];

const clerkTutorialSteps = [
    {
        title: "Automated Assistants",
        body: "You've hired your first Store Clerk! These robots will automatically move to the front customer and fulfill their entire order sequentially.",
        icon: "🤖",
        target: null,
        pos: 'center'
    },
    {
        title: "Bulk Handling Efficiency",
        body: "Unlike manual service, Clerks handle every item in a bulk order automatically. They take a moment to process, but they never make mistakes!",
        icon: "📦",
        target: null,
        pos: 'center'
    },
    {
        title: "Upgrading for Performance",
        body: "You can upgrade your clerks via the main Upgrade Menu or by clicking the button above their heads. Focus on Speed for faster service!",
        icon: "⚡",
        target: null,
        pos: 'center'
    }
];

// Initialization
function init() {
    updateUI();
    startSpawner();
    refreshStarShop();
    setupEventListeners();
    requestAnimationFrame(gameLoop);

    // Prompt for tutorial on every visit
    const prompt = document.getElementById('tutorial-prompt');
    if (prompt) prompt.classList.remove('hidden');
}

function updateUI() {
    coinDisplay.textContent = state.coins;
    repDisplay.textContent = state.reputation;
    
    const dayCounter = document.getElementById('day-counter');
    if (dayCounter) dayCounter.textContent = `DAY ${state.day}`;
    
    const dayTimer = document.getElementById('day-timer');
    if (dayTimer) {
        const mins = Math.floor(state.currentDayTime / 60);
        const secs = Math.floor(state.currentDayTime % 60);
        dayTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    const livesVal = document.querySelector('#lives-display .value');
    if (livesVal) livesVal.textContent = state.lives;

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

function showFloatingText(x, y, text, type = 'gold') {
    const div = document.createElement('div');
    div.className = `floating-text text-${type}`;
    div.textContent = text;
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    document.getElementById('game-container').appendChild(div);
    setTimeout(() => div.remove(), 1200);
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
    if (!state.isDayActive) return;
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
    let remainingOrders = [];

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
        
        // 50% chance for multi-order (2-3 items) if unlocked
        if (state.hasMultiOrder && Math.random() < 0.50) {
            isOrderAll = true;
            // Shuffle and pick unique items
            const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
            const count = Math.random() < 0.5 ? 2 : 3;
            remainingOrders = shuffled.slice(0, count).map(i => ({...i}));
            
            item = { 
                icon: '📦', 
                name: 'Multi Order', 
                price: remainingOrders.reduce((acc, o) => acc + o.price, 0) 
            };
        } else {
            item = availableItems[Math.floor(Math.random() * availableItems.length)];
            remainingOrders = [item];
        }
    }
    
    const id = Date.now();
    
    // Calculate custom patience for multi-orders (2.5s per item extra)
    let customPatience = state.patienceTime;
    if (remainingOrders && remainingOrders.length > 1) {
        customPatience += (remainingOrders.length - 1) * 1000;
    }

    const customer = {
        id,
        type,
        order: item,
        entryTime: Date.now(),
        isOrderAll,
        remainingOrders,
        patienceLimit: customPatience
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
        <div class="patience-container">
            <div class="patience-fill"></div>
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
            
            // Opacity gradient: 100% at front, down to ~10% at back
            const opacity = Math.max(0.1, 1 - (index * 0.2));
            el.style.opacity = opacity.toString();
        }
    });
}

let lastTime = performance.now();
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (state.isDayActive && state.currentDayTime > 0) {
        state.currentDayTime -= deltaTime / 1000;
        if (state.currentDayTime <= 0) {
            state.currentDayTime = 0;
            checkDayEnd();
        }
    }

    updatePatience(deltaTime);
    updateShopTimer(deltaTime);
    updateActiveBoosts(deltaTime);
    updateClerks(deltaTime);
    updateUI();
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
    
    const shopTimerEl = document.getElementById('shop-timer-display');
    if (shopTimerEl) shopTimerEl.textContent = timeStr;
    
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
        state.currentPatience = frontCustomer.patienceLimit || state.patienceTime;
    }

    state.currentPatience -= dt;

    const el = document.getElementById(`customer-${frontCustomer.id}`);
    if (el) {
        const fill = el.querySelector('.patience-fill');
        if (fill) {
            const limit = frontCustomer.patienceLimit || state.patienceTime;
            const percentage = (state.currentPatience / limit) * 100;
            fill.style.width = `${Math.max(0, percentage)}%`;
            if (percentage < 30) fill.style.background = '#ff4b2b';
            else if (percentage < 60) fill.style.background = '#ffb347';
            else fill.style.background = '#00f2ff';
        }
    }

    if (state.currentPatience <= 0) {
        state.reputation = Math.max(0, state.reputation - 1);
        
        // Negative Star Pop-up
        const el = document.getElementById(`customer-${frontCustomer.id}`);
        if (el) {
            const rect = el.getBoundingClientRect();
            showFloatingText(rect.left + 50, rect.top, "-1 ⭐", 'red');
        }

        showNotification("Too slow! Customer left.");
        removeCustomer(frontCustomer.id, true);
        updateUI();
        tongSay("They couldn't wait any longer...");
        state.lastFrontCustomerId = null;
    }
}

function startSpawner() {
    // Spawning interval scales with Day (10% faster each day)
    const scaledRate = state.baseSpawnRate / (1 + (state.day - 1) * 0.10);
    const marketingBonus = state.upgrades.find(u => u.id === 'marketing').level * 400;
    
    setInterval(() => {
        spawnCustomer();
    }, Math.max(800, scaledRate - marketingBonus));
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
    
    // Negative Star Pop-up
    const el = document.getElementById(`customer-${firstCustomer.id}`);
    if (el) {
        const rect = el.getBoundingClientRect();
        showFloatingText(rect.left + 50, rect.top, "-1 ⭐", 'red');
    }

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
    state.dailyCoins += totalEarned;
    state.dailyRep += Math.ceil(1 * state.starMultiplier);
    
    // Tip Logic
    let tip = 0;
    const shouldTip = firstCustomer.type.isVIP || Math.random() < 0.2;
    
    const customerEl = document.getElementById(`customer-${firstCustomer.id}`);
    const rect = customerEl ? customerEl.getBoundingClientRect() : { left: window.innerWidth/2, top: window.innerHeight/2 };
    const x = rect.left + 50;
    const y = rect.top;
    
    showFloatingText(x, y, `+${totalEarned} 🌕`, 'gold');
    showFloatingText(x + 50, y - 30, `+${Math.ceil(1 * state.starMultiplier)} ⭐`, 'star');

    if (shouldTip) {
        tip = Math.floor(basePrice * (firstCustomer.type.isVIP ? 5.0 : 0.25) * state.moonMultiplier);
        state.tipJarAmount = Math.min(state.tipJarMax, state.tipJarAmount + tip);
        
        showFloatingText(x - 50, y + 30, `+${tip} TIP`, 'silver');
        
        const jarIcon = document.getElementById('tip-jar-icon');
        if (jarIcon) {
            jarIcon.classList.remove('jar-shaking');
            void jarIcon.offsetWidth; // Trigger reflow
            jarIcon.classList.add('jar-shaking');
        }
    }

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
    state.upgrades.filter(u => u.category !== 'clerk').forEach(upgrade => {
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
        
        // Handle unique unlocks
        if (id === 'popularity' && upgrade.level === 1) state.maxCustomers = 6;
        if (id === 'bulk-service' && upgrade.level === 1) state.hasMultiOrder = true;
        if (id === 'clerk-speed') state.clerkSpeedLevel = upgrade.level;
        if (id === 'clerk-tips') state.clerkTipLevel = upgrade.level;

        upgrade.cost = Math.floor(upgrade.cost * 1.8);
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
        let icon = item.type === 'moon' ? '🌕' : '⭐';
        
        div.innerHTML = `
            <div class="item-rarity">${item.rarity}</div>
            <div class="item-icon-display">${icon}</div>
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
        let icon = potion.type === 'moon' ? '🌕' : '⭐';
        
        div.innerHTML = `
            <div class="item-rarity">${potion.rarity}</div>
            <div class="item-icon-display" style="font-size: 2rem; margin-right: 15px;">${icon}</div>
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

function openTutorial() {
    tutorialStep = 0;
    renderTutorialStep();
    tutorialModal.classList.remove('hidden');
}

function renderTutorialStep() {
    const step = tutorialSteps[tutorialStep];
    
    // Remove previous highlights and positions
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    tutorialModal.classList.remove('pos-top', 'pos-bottom', 'pos-left', 'pos-right', 'pos-center', 'compact');
    
    // Add new highlight and position
    if (step.target) {
        const el = document.getElementById(step.target);
        if (el) el.classList.add('tutorial-highlight');
        tutorialModal.classList.add('compact');
    }
    
    tutorialModal.classList.add(`pos-${step.pos}`);

    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-body').innerHTML = `<p>${step.body}</p><div class="tutorial-image">${step.icon}</div>`;
    document.getElementById('tutorial-step-indicator').textContent = `${tutorialStep + 1} / ${tutorialSteps.length}`;
    
    document.getElementById('tutorial-prev').classList.toggle('hidden', tutorialStep === 0);
    document.getElementById('tutorial-next').textContent = tutorialStep === tutorialSteps.length - 1 ? "FINISH" : "NEXT";
}

function toggleMusic() {
    const btn = document.getElementById('music-toggle-btn');
    if (state.isMusicPlaying) {
        bgMusic.pause();
        state.isMusicPlaying = false;
        btn.textContent = "MUSIC: OFF";
    } else {
        bgMusic.play().catch(e => console.log("Music play blocked by browser"));
        state.isMusicPlaying = true;
        btn.textContent = "MUSIC: ON";
    }
}

function setupEventListeners() {
    // Music Toggle
    document.getElementById('music-toggle-btn').addEventListener('click', toggleMusic);

    // Tutorial Prompt Listeners
    const prompt = document.getElementById('tutorial-prompt');
    document.getElementById('prompt-yes').addEventListener('click', () => {
        prompt.classList.add('hidden');
        isClerkTutorial = false;
        openTutorial();
        state.isDayActive = true;
        // Start music on first interaction
        if (!state.isMusicPlaying) toggleMusic();
    });
    document.getElementById('prompt-no').addEventListener('click', () => {
        prompt.classList.add('hidden');
        state.isDayActive = true;
        // Start music on first interaction
        if (!state.isMusicPlaying) toggleMusic();
    });

    // Clerk Tutorial Prompt Listeners
    const clerkPrompt = document.getElementById('clerk-tutorial-prompt');
    document.getElementById('clerk-prompt-yes').addEventListener('click', () => {
        clerkPrompt.classList.add('hidden');
        openClerkTutorial();
    });
    document.getElementById('clerk-prompt-no').addEventListener('click', () => {
        clerkPrompt.classList.add('hidden');
    });

    document.getElementById('tutorial-next').addEventListener('click', () => {
        const steps = isClerkTutorial ? clerkTutorialSteps : tutorialSteps;
        if (tutorialStep < steps.length - 1) {
            tutorialStep++;
            renderTutorialStep();
        } else {
            tutorialModal.classList.add('hidden');
            document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
            isClerkTutorial = false; // Reset
        }
    });

    document.getElementById('tutorial-prev').addEventListener('click', () => {
        if (tutorialStep > 0) {
            tutorialStep--;
            renderTutorialStep();
        }
    });

    document.getElementById('close-tutorial-modal').addEventListener('click', () => {
        tutorialModal.classList.add('hidden');
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    });

    document.getElementById('next-day-btn').addEventListener('click', () => {
        startNextDay();
    });

    document.getElementById('buy-clerk-btn').addEventListener('click', buyClerk);
    
    document.getElementById('star-shop-btn').addEventListener('click', openStarShop);
    document.getElementById('close-star-modal').addEventListener('click', () => {
        starShopModal.classList.add('hidden');
    });

    document.getElementById('close-clerk-modal').addEventListener('click', () => {
        document.getElementById('clerk-upgrade-modal').classList.add('hidden');
    });

    const inventoryBtn = document.getElementById('inventory-btn');
    inventoryBtn.addEventListener('click', openInventory);
    document.getElementById('close-inventory-modal').addEventListener('click', () => {
        inventoryModal.classList.add('hidden');
    });

    document.getElementById('claim-tip-btn').addEventListener('click', () => {
        if (state.tipJarAmount >= state.tipJarMax) {
            state.coins += state.tipJarMax;
            state.tipJarAmount = 0;
            updateUI();
            showNotification("Tip Jar Claimed! +2500 Moon Tokens");
            
            // Jackpot Effect
            const x = window.innerWidth / 2;
            const y = 150;
            for(let i = 0; i < 5; i++) {
                setTimeout(() => {
                    showFloatingText(x + (Math.random() * 200 - 100), y + (Math.random() * 50), "+500 🌕", 'gold');
                }, i * 100);
            }
        }
    });

    document.getElementById('inventory-bar').addEventListener('click', (e) => {
        const item = e.target.closest('.inventory-item');
        if (item) fulfillOrder(item.dataset.item);
    });

    upgradeMenuBtn.addEventListener('click', openUpgrades);
    closeModalBtn.addEventListener('click', () => {
        upgradeModal.classList.add('hidden');
        if (state.pendingClerkTutorial) {
            state.pendingClerkTutorial = false;
            document.getElementById('clerk-tutorial-prompt').classList.remove('hidden');
        }
    });

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
        
        // Developer Cheat Code
        if (key.toLowerCase() === 'p') {
            state.coins += 10000;
            state.reputation += 10000;
            updateUI();
            showNotification("DEV CHEAT: +10,000 Moon & Stars");
        }
    });
}

function startNextDay() {
    state.day++;
    state.customersRemaining = 10 + (state.day - 1) * 3;
    state.dayTimeLimit += 30; // Add 30s each day
    state.currentDayTime = state.dayTimeLimit;
    state.dailyCoins = 0;
    state.dailyRep = 0;
    state.isDayActive = true;
    
    // Scale Patience
    state.patienceTime = Math.max(2000, state.basePatience - (state.day - 1) * 120);
    
    document.getElementById('day-over-modal').classList.add('hidden');
    showNotification(`Day ${state.day} Started!`);
}

function checkDayEnd() {
    if (state.currentDayTime <= 0 && state.isDayActive) {
        state.isDayActive = false;
        
        // Penalty Check: More than 3 customers left OR 3 or fewer stars?
        if (state.activeCustomers.length > 3 || state.reputation <= 3) {
            state.lives--;
            updateUI();
            
            let msg = state.activeCustomers.length > 3 ? "Too many customers left!" : "Not enough stars earned!";
            showNotification(`${msg} Life lost.`);
            
            if (state.lives <= 0) {
                showGameOver();
                return;
            }
        }

        showDayOver();
    }
}

function showGameOver() {
    document.getElementById('final-day').textContent = state.day;
    document.getElementById('final-coins').textContent = state.coins;
    document.getElementById('game-over-modal').classList.remove('hidden');
    // Clear customers
    state.activeCustomers = [];
    document.getElementById('customer-area').innerHTML = '';
}

function showDayOver() {
    document.getElementById('day-over-title').textContent = `Day ${state.day} Complete!`;
    document.getElementById('day-tokens').textContent = state.dailyCoins;
    document.getElementById('day-rep').textContent = state.dailyRep;
    document.getElementById('day-over-modal').classList.remove('hidden');
}

// Add checkDayEnd to game loop or removeCustomer
const originalRemoveCustomer = removeCustomer;
removeCustomer = function(id, isPatienceLoss) {
    originalRemoveCustomer(id, isPatienceLoss);
    checkDayEnd();
};

function buyClerk() {
    const cost = state.clerks.length === 0 ? 10000 : 15000;
    if (state.coins >= cost && state.clerks.length < 2) {
        state.coins -= cost;
        state.clerks.push({
            id: state.clerks.length + 1,
            isWorking: false,
            progress: 0,
            targetCustomerId: null
        });
        updateUI();
        renderClerks();
        showNotification(`Hired Store Clerk #${state.clerks.length}!`);
        tongSay("Welcome to the team!");
        if (state.clerks.length === 1) {
            state.pendingClerkTutorial = true;
        }
        updateUI();
        renderClerks();
    } else if (state.clerks.length >= 2) {
        showNotification("Maximum clerks reached!");
    } else {
        showNotification("Not enough Moon Tokens!");
    }
}

function renderClerks() {
    const area = document.getElementById('clerk-area');
    area.innerHTML = '';
    state.clerks.forEach(clerk => {
        const div = document.createElement('div');
        div.className = `clerk clerk-${clerk.id}`;
        div.innerHTML = `
            <button class="clerk-upgrade-btn" onclick="openClerkUpgrades(${clerk.id})">UPGRADE CLERK</button>
            <div class="clerk-avatar">🤖</div>
            <div class="clerk-status-bar"><div class="clerk-progress" id="clerk-prog-${clerk.id}"></div></div>
        `;
        area.appendChild(div);
    });
    
    // Update Upgrade Menu status
    const status = document.getElementById('clerk-status');
    const buyBtn = document.getElementById('buy-clerk-btn');
    status.textContent = `${state.clerks.length} / 2 Unlocked`;
    if (state.clerks.length >= 2) {
        buyBtn.textContent = "MAX CLERKS";
        buyBtn.disabled = true;
    } else {
        const cost = state.clerks.length === 0 ? 10000 : 15000;
        buyBtn.textContent = `BUY CLERK (${cost.toLocaleString()} 🌕)`;
    }
}

function updateClerks(dt) {
    if (!state.isDayActive) return;

    state.clerks.forEach(clerk => {
        if (!clerk.isWorking) {
            // Find a customer that isn't already being helped by another clerk
            const customer = state.activeCustomers.find(c => {
                const isBeingHelped = state.clerks.some(other => other.targetCustomerId === c.id);
                return !isBeingHelped;
            });

            if (customer) {
                clerk.isWorking = true;
                clerk.targetCustomerId = customer.id;
                clerk.progress = 0;
            }
        } else {
            // Base speed 6s, level reduces by 0.7s
            const speedTime = Math.max(1500, 6000 - (state.clerkSpeedLevel * 700));
            clerk.progress += dt;
            
            const progEl = document.getElementById(`clerk-prog-${clerk.id}`);
            if (progEl) progEl.style.width = `${(clerk.progress / speedTime) * 100}%`;

            if (clerk.progress >= speedTime) {
                const customer = state.activeCustomers.find(c => c.id === clerk.targetCustomerId);
                if (customer) {
                    // Serve ALL items if it's a multi-order or single
                    serveByClerk(customer);
                }
                clerk.isWorking = false;
                clerk.targetCustomerId = null;
                clerk.progress = 0;
                if (progEl) progEl.style.width = '0%';
            }
        }
    });
}

function serveByClerk(customer) {
    // Fulfill all orders
    const itemsToServe = [...customer.order.remainingOrders];
    if (itemsToServe.length === 0) itemsToServe.push(customer.order.item);

    itemsToServe.forEach(item => {
        // We simulate the fulfillment logic but skip the manual click
        // Clerk Tip Bonus logic
        const originalTipChance = 0.2 + (state.clerkTipLevel * 0.1);
        
        // Temporarily override tip logic if needed or just use current state
        completeFulfillment(customer, true); // True flag for clerk-served
    });
}

window.openClerkUpgrades = (clerkId) => {
    renderClerkUpgrades();
    document.getElementById('clerk-upgrade-modal').classList.remove('hidden');
};

function renderClerkUpgrades() {
    const list = document.getElementById('clerk-upgrade-list');
    list.innerHTML = '';
    state.upgrades.filter(u => u.category === 'clerk').forEach(upgrade => {
        const item = document.createElement('div');
        item.className = 'upgrade-item';
        const costType = upgrade.currency === 'coins' ? '🌕' : '⭐';
        item.innerHTML = `
            <h3>${upgrade.name} (Lvl ${upgrade.level}/${upgrade.max})</h3>
            <p>${upgrade.description}</p>
            <button class="buy-btn" ${((upgrade.currency === 'coins' ? state.coins : state.reputation) < upgrade.cost || upgrade.level >= upgrade.max) ? 'disabled' : ''} 
                onclick="buyUpgrade('${upgrade.id}', true)">
                ${upgrade.level >= upgrade.max ? 'MAXED' : `BUY: ${upgrade.cost} ${costType}`}
            </button>
        `;
        list.appendChild(item);
    });
}

// Update buyUpgrade to support clerk modal refresh
const originalBuyUpgrade = buyUpgrade;
buyUpgrade = function(id, isClerkModal = false) {
    originalBuyUpgrade(id);
    if (isClerkModal) renderClerkUpgrades();
};

let isClerkTutorial = false;
function openClerkTutorial() {
    isClerkTutorial = true;
    tutorialStep = 0;
    renderTutorialStep();
    tutorialModal.classList.remove('hidden');
}

// Override renderTutorialStep for Clerk logic
const originalRenderTutorialStep = renderTutorialStep;
renderTutorialStep = function() {
    const steps = isClerkTutorial ? clerkTutorialSteps : tutorialSteps;
    const step = steps[tutorialStep];
    
    // Remove previous highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
    
    // Add new highlight if target exists
    if (step.target) {
        const el = document.getElementById(step.target);
        if (el) el.classList.add('tutorial-highlight');
    }
    
    // Update Content
    document.getElementById('tutorial-title').textContent = step.title;
    document.getElementById('tutorial-body').innerHTML = `<p>${step.body}</p><div class="tutorial-image">${step.icon}</div>`;
    document.getElementById('tutorial-step-indicator').textContent = `${tutorialStep + 1} / ${steps.length}`;
    
    document.getElementById('tutorial-prev').classList.toggle('hidden', tutorialStep === 0);
    document.getElementById('tutorial-next').textContent = tutorialStep === steps.length - 1 ? "FINISH" : "NEXT";
};

// Override next button for tutorial type switching
const originalNextListener = document.getElementById('tutorial-next').onclick;
document.getElementById('tutorial-next').onclick = null; // We'll handle it in setupEventListeners or re-assign

// Actually, I'll just update the event listener in setupEventListeners to use the dynamic 'steps'

// Start the game
init();

// Update completeFulfillment to handle clerk tips
const originalCompleteFulfillment = completeFulfillment;
completeFulfillment = function(customer, isClerk = false) {
    if (isClerk) {
        // Bonus Tip Chance for Clerk
        const clerkTipLevel = state.clerkTipLevel;
        // The standard completeFulfillment already uses state.upgrades for speed-service
        // Let's just boost the TipJar chance or amount here
    }
    originalCompleteFulfillment(customer);
};
