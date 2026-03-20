const canvas = document.getElementById("game")
const ctx = canvas.getContext("2d")

const WIDTH = canvas.width
const HEIGHT = canvas.height

const ammoUI = document.getElementById("ammo")
const magUI = document.getElementById("mag")
const weaponUI = document.getElementById("weapon")
const shotgunAmmoUI = document.getElementById("shotgunAmmo")
const flameAmmoUI = document.getElementById("flameAmmo")
const woodUI = document.getElementById("wood")
const coinsUI = document.getElementById("coins")
const grenadesUI = document.getElementById("grenades")
const wallUI = document.getElementById("wall")
const roundUI = document.getElementById("round")
const arenaLifeUI = document.getElementById("arenaLife")
const reloadBox = document.getElementById("reloadBox")
const reloadFill = document.getElementById("reloadFill")
const overlay = document.getElementById("overlay")
const overlayTitle = document.getElementById("overlayTitle")
const overlaySubtitle = document.getElementById("overlaySubtitle")
const startBtn = document.getElementById("startBtn")
const retryBtn = document.getElementById("retryBtn")
const shopOverlay = document.getElementById("shopOverlay")
const shopSubtitle = document.getElementById("shopSubtitle")
const closeShopBtn = document.getElementById("closeShopBtn")
const toolsSection = document.getElementById("toolsSection")
const toolsSubtitle = document.getElementById("toolsSubtitle")
const toolFullRepairButton = document.getElementById("toolFullRepair")
const toolGrenadeButton = document.getElementById("toolGrenade")
const toolTrapButton = document.getElementById("toolTrap")

const weaponPistolButton = document.getElementById("weaponPistol")
const weaponShotgunButton = document.getElementById("weaponShotgun")
const weaponFlameButton = document.getElementById("weaponFlame")

const upgradeWallButton = document.getElementById("upgradeWall")
const upgradeFireRateButton = document.getElementById("upgradeFireRate")
const upgradePistolMagButton = document.getElementById("upgradePistolMag")
const upgradeBulletSpeedButton = document.getElementById("upgradeBulletSpeed")
const upgradeFlameButton = document.getElementById("upgradeFlame")
const upgradeMoveSpeedButton = document.getElementById("upgradeMoveSpeed")

const BASE_MAGAZINE_SIZE = 10
const RELOAD_TIME_MS = 1000
const REPAIR_TIME_MS = 1000
const REPAIR_AMOUNT = 25
const SHOTGUN_DROP_CHANCE = 0.2
const SHOTGUN_DROP_AMOUNT = 10
const FLAME_DROP_CHANCE = 0.12
const FLAME_DROP_AMOUNT = 35
const FLAME_DROP_PITY_KILLS = 18
const WOOD_DROP_CHANCE = 0.4
const SHOP_INTERVAL = 5
const SECRET_TOOLS_UNLOCK_ROUND = 10
const FLAME_BASE_RANGE = 240
const FLAME_BASE_AMMO = 80
const MAX_UPGRADE_LEVEL = 20
const RED_ZOMBIE_HP = 2
const WALL_UPGRADE_TIME_MS = 5000
const MAX_WALL_FORT_LEVEL = 4
const TRANSITION_DOWN_MS = 700
const TRANSITION_CENTER_MS = 950
const MAX_ARENA_LIFE = 100
const ARENA_HIT_SHIELD_MS = 1000

const TOOL_COSTS = {
    fullRepairCoins: 100,
    fullRepairWood: 10,
    grenade: 80,
    trap: 120
}

const UPGRADE_CONFIG = {
    wall: { base: 20, step: 55, label: "Pared Reforzada" },
    fireRate: { base: 20, step: 52, label: "Cadencia" },
    pistolMag: { base: 16, step: 50, label: "Cargador Extendido" },
    bulletSpeed: { base: 14, step: 48, label: "Municion Veloz" },
    flame: { base: 22, step: 58, label: "Lanzallamas" },
    moveSpeed: { base: 15, step: 49, label: "Botas" }
}

let gameRunning = false
let gameOver = false
let shopOpen = false

let ammo = 0
let magazineAmmo = 0
let shotgunAmmo = 0
let flameAmmo = 0
let woodCount = 0
let coins = 0
let grenades = 0
let activeWeapon = "pistol"

let isReloading = false
let reloadStartTime = 0
let reloadProgress = 0

let isRepairing = false
let repairStartTime = 0
let repairProgress = 0

let round = 1
let zombiesThisRound = 0
let zombiesSpawned = 0
let zombiesProcessed = 0
let nextShotTime = 0

let player
let wall
let bullets = []
let zombies = []
let ammoDrops = []
let shotgunDrops = []
let flameDrops = []
let woodDrops = []
let flashes = []
let explosions = []
let flameBursts = []
let traps = []

let spawnTimer = null
let roundBanner = null
let roundBannerAlpha = 0
let roundBannerTimer = 0
let killsSinceFlameDrop = 0
let shopOfferTypes = []
let secretToolsUnlocked = false

let upgrades
let upgradeLevels
let wallFortLevel = 0
let wallUpgradeProgressMs = 0
let wallUpgradeZone
let frontBarriers = []
let renderTimeMs = 0
let playerRecoil = 0
let gamePhase = "wall"
let transitionActive = false
let transitionState = "down"
let transitionTimer = 0
let transitionFromX = 0
let transitionFromY = 0
let mouseX = WIDTH / 2
let mouseY = HEIGHT / 2
let mouseDown = false
let arenaLife = MAX_ARENA_LIFE
let arenaShieldMs = 0
let arenaKnockbackVX = 0
let arenaKnockbackVY = 0

const keys = {}
const svgSpriteCache = new Map()

function getSvgImage(cacheKey, svgMarkup){
    if(svgSpriteCache.has(cacheKey)) return svgSpriteCache.get(cacheKey)

    const image = new Image()
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
    svgSpriteCache.set(cacheKey, image)
    return image
}

function buildPlayerSvg(weaponType){
    let headRing = "#4f8fff"
    if(weaponType === "shotgun") headRing = "#f97393"
    if(weaponType === "flame") headRing = "#ff9f1c"

    let weaponColor = "#dfe7fd"
    if(weaponType === "shotgun") weaponColor = "#ffd0dd"
    if(weaponType === "flame") weaponColor = "#ffd166"

    let weapon = ""
    if(weaponType === "shotgun"){
        weapon = `<g transform="translate(10 2)"><rect x="7" y="11" width="12" height="6" rx="3" fill="#4b5563"/><rect x="10" y="4" width="6" height="12" rx="2" fill="${weaponColor}"/><rect x="9" y="1" width="8" height="4" rx="1" fill="#111827"/></g>`
    } else if(weaponType === "flame"){
        weapon = `<g transform="translate(10 2)"><rect x="7" y="11" width="12" height="6" rx="3" fill="#4b5563"/><rect x="10" y="5" width="6" height="11" rx="2" fill="${weaponColor}"/><path d="M13 1 C9 4, 9 7, 13 9 C17 7, 17 4, 13 1 Z" fill="#ff6b35"/><path d="M13 3 C11 5, 11 6.5, 13 7.5 C15 6.5, 15 5, 13 3 Z" fill="#ffe066"/></g>`
    } else {
        weapon = `<g transform="translate(11 3)"><rect x="7" y="11" width="10" height="6" rx="3" fill="#4b5563"/><rect x="10" y="7" width="4" height="9" rx="2" fill="${weaponColor}"/><rect x="9" y="4" width="6" height="4" rx="1" fill="#111827"/></g>`
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" shape-rendering="geometricPrecision">
        <circle cx="20" cy="20" r="13" fill="#3b4656"/>
        <circle cx="20" cy="20" r="10" fill="#2a3340"/>
        <circle cx="20" cy="20" r="15" fill="none" stroke="${headRing}" stroke-width="2.6"/>
        <path d="M20 7 L30 13 L30 27 L20 33 L10 27 L10 13 Z" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="1.2"/>
        <ellipse cx="7.4" cy="21" rx="4" ry="6" fill="#4b5563"/>
        <ellipse cx="32.6" cy="21" rx="4" ry="6" fill="#4b5563"/>
        ${weapon}
    </svg>`
}

function buildZombieSvg(zombieType, isHit){
    let skinColor = "#4d7a3e"
    if(zombieType === "red") skinColor = "#8f2c2c"
    if(isHit) skinColor = "#f9fafb"

    let coreColor = "#3a5d30"
    if(zombieType === "red") coreColor = "#5f1d1d"
    if(isHit) coreColor = "#d9dde2"

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 34" shape-rendering="geometricPrecision">
        <circle cx="17" cy="17" r="11" fill="${skinColor}"/>
        <circle cx="17" cy="17" r="8.5" fill="${coreColor}"/>
        <circle cx="17" cy="17" r="13" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>
        <path d="M10 10 L24 24" stroke="rgba(0,0,0,0.28)" stroke-width="1.1"/>
        <path d="M24 10 L10 24" stroke="rgba(0,0,0,0.24)" stroke-width="1.1"/>
        <ellipse cx="4.8" cy="18" rx="3.6" ry="5.4" fill="${skinColor}"/>
        <ellipse cx="29.2" cy="18" rx="3.6" ry="5.4" fill="${skinColor}"/>
    </svg>`
}

function getPistolMagazineSize(){
    return BASE_MAGAZINE_SIZE + upgrades.pistolMagBonus
}

function getFireRateMultiplier(){
    return Math.max(0.45, 1 - upgrades.fireRateLevel * 0.1)
}

function getBulletSpeed(baseSpeed){
    return baseSpeed * upgrades.bulletSpeedMultiplier
}

function getWeaponCooldown(){
    const multiplier = getFireRateMultiplier()

    if(activeWeapon === "shotgun") return 520 * multiplier
    if(activeWeapon === "flame") return 90 * multiplier
    return 260 * multiplier
}

function updateSpawnTimer(){
    if(spawnTimer) clearInterval(spawnTimer)

    if(gameRunning && !shopOpen && !gameOver){
        spawnTimer = setInterval(spawnZombie, spawnIntervalForRound(round))
    }
}

function zombiesForRound(currentRound){
    return 6 + (currentRound - 1) * 4
}

function spawnIntervalForRound(currentRound){
    return Math.max(500, 1500 - (currentRound - 1) * 100)
}

function lerp(start, end, t){
    return start + (end - start) * t
}

function getAimAngle(originX, originY){
    return Math.atan2(mouseY - originY, mouseX - originX)
}

function getAimDirection(originX, originY){
    const dx = mouseX - originX
    const dy = mouseY - originY
    const distance = Math.hypot(dx, dy)

    if(distance < 0.001){
        return { x: 0, y: -1, angle: -Math.PI / 2 }
    }

    return {
        x: dx / distance,
        y: dy / distance,
        angle: Math.atan2(dy, dx)
    }
}

function refreshMouseFromEvent(event){
    const rect = canvas.getBoundingClientRect()
    const scaleX = WIDTH / rect.width
    const scaleY = HEIGHT / rect.height
    mouseX = (event.clientX - rect.left) * scaleX
    mouseY = (event.clientY - rect.top) * scaleY
}

function startArenaTransition(){
    gamePhase = "transition"
    transitionActive = true
    transitionState = "down"
    transitionTimer = 0
    transitionFromX = player.x
    transitionFromY = player.y
    clearReloadUI()
    clearRepair()

    zombies = []
    bullets = []
    frontBarriers = []
    traps = []
    if(spawnTimer) clearInterval(spawnTimer)
}

function processArenaTransition(deltaMs){
    if(!transitionActive) return

    transitionTimer += deltaMs

    if(transitionState === "down"){
        const progress = Math.min(transitionTimer / TRANSITION_DOWN_MS, 1)
        const targetY = HEIGHT - player.height - 8
        player.y = lerp(transitionFromY, targetY, progress)
        player.x = transitionFromX

        if(progress >= 1){
            transitionState = "center"
            transitionTimer = 0
            transitionFromX = player.x
            transitionFromY = player.y
        }

        return
    }

    const progress = Math.min(transitionTimer / TRANSITION_CENTER_MS, 1)
    const centerX = WIDTH / 2 - player.width / 2
    const centerY = HEIGHT / 2 - player.height / 2
    player.x = lerp(transitionFromX, centerX, progress)
    player.y = lerp(transitionFromY, centerY, progress)

    if(progress >= 1){
        transitionActive = false
        gamePhase = "arena"
        wall.life = 0
        updateUI()
        roundBanner = "Modo Arena"
        roundBannerAlpha = 1
        roundBannerTimer = 120
        updateSpawnTimer()
    }
}

function createInitialUpgrades(){
    return {
        moveSpeed: 7,
        fireRateLevel: 0,
        bulletSpeedMultiplier: 1,
        pistolMagBonus: 0,
        wallMaxLife: 100,
        flameUnlocked: false,
        flameRange: FLAME_BASE_RANGE,
        flamePower: 1,
        flameFuelBonus: 0
    }
}

function createInitialUpgradeLevels(){
    return {
        wall: 0,
        fireRate: 0,
        pistolMag: 0,
        bulletSpeed: 0,
        flame: 0,
        moveSpeed: 0
    }
}

const SHOP_BUTTON_MAP = {
    wall: upgradeWallButton,
    fireRate: upgradeFireRateButton,
    pistolMag: upgradePistolMagButton,
    bulletSpeed: upgradeBulletSpeedButton,
    flame: upgradeFlameButton,
    moveSpeed: upgradeMoveSpeedButton
}

function pickRandomShopOffers(){
    const allTypes = Object.keys(SHOP_BUTTON_MAP)
    const notMaxed = allTypes.filter(type => !isUpgradeMaxed(type))
    const pool = notMaxed.length > 0 ? notMaxed : allTypes
    const picked = []

    while(pool.length > 0 && picked.length < 3){
        const index = Math.floor(Math.random() * pool.length)
        picked.push(pool.splice(index, 1)[0])
    }

    return picked
}

function getUpgradeCost(type){
    const config = UPGRADE_CONFIG[type]
    const level = upgradeLevels[type]
    return Math.min(1000, config.base + (level * config.step))
}

function isUpgradeMaxed(type){
    return upgradeLevels[type] >= MAX_UPGRADE_LEVEL
}

function updateShopCard(button, type){
    const nameEl = button.querySelector(".shop-name")
    const costEl = button.querySelector(".shop-cost")
    const level = upgradeLevels[type]
    const maxed = isUpgradeMaxed(type)

    if(nameEl){
        nameEl.textContent = `${UPGRADE_CONFIG[type].label} (Nv ${level}/${MAX_UPGRADE_LEVEL})`
    }

    if(costEl){
        if(maxed){
            costEl.textContent = "MAX"
        } else {
            costEl.textContent = `${getUpgradeCost(type)} monedas`
        }
    }

    button.classList.toggle("disabled", maxed || coins < getUpgradeCost(type))
}

function createFrontBarrierRow(level){
    const segmentCount = 8
    const gap = 8
    const totalGap = gap * (segmentCount + 1)
    const segmentWidth = (wall.width - totalGap) / segmentCount
    const rowY = wall.y - 30 - (level - 1) * 26
    const durability = 3 + level

    for(let index = 0; index < segmentCount; index++){
        const x = gap + index * (segmentWidth + gap)
        frontBarriers.push({
            x,
            y: rowY,
            width: segmentWidth,
            height: 12,
            hp: durability,
            maxHp: durability,
            level
        })
    }
}

function getWallUpgradeWoodCost(){
    return (wallFortLevel + 1) * 10
}

function levelUpWallFortification(){
    if(wallFortLevel >= MAX_WALL_FORT_LEVEL) return

    const woodCost = getWallUpgradeWoodCost()
    if(woodCount < woodCost) return

    woodCount -= woodCost
    wallFortLevel++
    wall.maxLife += 20
    wall.life = Math.min(wall.maxLife, wall.life + 20)
    createFrontBarrierRow(wallFortLevel)
    updateUI()
}

function processWallUpgradeArea(deltaMs){
    if(wallFortLevel >= MAX_WALL_FORT_LEVEL) return

    const playerCenterX = player.x + player.width / 2
    const playerCenterY = player.y + player.height / 2
    const inZone = (
        playerCenterX >= wallUpgradeZone.x &&
        playerCenterX <= wallUpgradeZone.x + wallUpgradeZone.width &&
        playerCenterY >= wallUpgradeZone.y &&
        playerCenterY <= wallUpgradeZone.y + wallUpgradeZone.height
    )

    if(!inZone){
        wallUpgradeProgressMs = 0
        return
    }

    if(woodCount < getWallUpgradeWoodCost()){
        wallUpgradeProgressMs = 0
        return
    }

    wallUpgradeProgressMs += deltaMs

    while(wallUpgradeProgressMs >= WALL_UPGRADE_TIME_MS && wallFortLevel < MAX_WALL_FORT_LEVEL){
        wallUpgradeProgressMs -= WALL_UPGRADE_TIME_MS
        levelUpWallFortification()
    }

    if(wallFortLevel >= MAX_WALL_FORT_LEVEL){
        wallUpgradeProgressMs = 0
    }
}

function initGame(){
    upgrades = createInitialUpgrades()
    upgradeLevels = createInitialUpgradeLevels()

    player = {
        x: WIDTH / 2,
        y: HEIGHT - 62,
        width: 38,
        height: 38,
        speed: upgrades.moveSpeed
    }

    wall = {
        x: 0,
        y: HEIGHT - 100,
        width: WIDTH,
        height: 20,
        life: upgrades.wallMaxLife,
        maxLife: upgrades.wallMaxLife
    }

    wallUpgradeZone = {
        x: 18,
        y: player.y + 2,
        width: 118,
        height: player.height - 4
    }

    ammo = getPistolMagazineSize()
    magazineAmmo = 0
    shotgunAmmo = 0
    flameAmmo = 0
    woodCount = 0
    coins = 0
    grenades = 3
    activeWeapon = "pistol"
    isReloading = false
    isRepairing = false
    reloadProgress = 0
    repairProgress = 0
    nextShotTime = 0

    round = 1
    zombiesSpawned = 0
    zombiesProcessed = 0
    zombiesThisRound = zombiesForRound(round)

    bullets = []
    zombies = []
    ammoDrops = []
    shotgunDrops = []
    flameDrops = []
    woodDrops = []
    flashes = []
    explosions = []
    flameBursts = []
    traps = []

    gameOver = false
    shopOpen = false
    killsSinceFlameDrop = 0
    shopOfferTypes = Object.keys(SHOP_BUTTON_MAP).slice(0,3)
    secretToolsUnlocked = false
    wallFortLevel = 0
    wallUpgradeProgressMs = 0
    frontBarriers = []
    renderTimeMs = 0
    playerRecoil = 0
    gamePhase = "wall"
    transitionActive = false
    transitionState = "down"
    transitionTimer = 0
    transitionFromX = 0
    transitionFromY = 0
    mouseDown = false
    arenaLife = MAX_ARENA_LIFE
    arenaShieldMs = 0
    arenaKnockbackVX = 0
    arenaKnockbackVY = 0

    clearReloadUI()
    updateUI()
    updateSpawnTimer()
}

function updateUI(){
    ammoUI.textContent = `${ammo}/${getPistolMagazineSize()}`
    magUI.textContent = magazineAmmo
    shotgunAmmoUI.textContent = shotgunAmmo
    flameAmmoUI.textContent = flameAmmo
    woodUI.textContent = woodCount
    coinsUI.textContent = coins
    grenadesUI.textContent = grenades
    wallUI.textContent = wall.life
    roundUI.textContent = round
    if(arenaLifeUI){
        arenaLifeUI.textContent = gamePhase === "arena" ? Math.max(0, Math.ceil(arenaLife)) : "--"
    }

    if(activeWeapon === "shotgun") weaponUI.textContent = "Escopeta"
    else if(activeWeapon === "flame") weaponUI.textContent = "Lanzallamas"
    else weaponUI.textContent = "Pistola"

    weaponPistolButton.classList.toggle("active", activeWeapon === "pistol")
    weaponShotgunButton.classList.toggle("active", activeWeapon === "shotgun")
    weaponFlameButton.classList.toggle("active", activeWeapon === "flame")

    weaponShotgunButton.classList.toggle("disabled", shotgunAmmo <= 0)
    weaponFlameButton.classList.toggle("disabled", !upgrades.flameUnlocked || flameAmmo <= 0)

    updateShopButtons()
    updateToolsUI()
}

function updateShopButtons(){
    if(!upgradeWallButton) return

    Object.entries(SHOP_BUTTON_MAP).forEach(([type, button]) => {
        const visible = shopOfferTypes.includes(type)
        button.style.display = visible ? "flex" : "none"

        if(visible){
            updateShopCard(button, type)
        }
    })
}

function updateToolButtonDisabled(button, disabled){
    button.classList.toggle("disabled", disabled)
}

function updateToolsUI(){
    if(!toolsSection) return

    const unlocked = secretToolsUnlocked || round >= SECRET_TOOLS_UNLOCK_ROUND
    secretToolsUnlocked = unlocked

    if(!unlocked){
        toolsSection.classList.add("hidden")
        toolsSubtitle.textContent = `Se desbloquea en ronda ${SECRET_TOOLS_UNLOCK_ROUND}`
        return
    }

    toolsSection.classList.remove("hidden")
    toolsSubtitle.textContent = `Desbloqueado. Monedas: ${coins} | Madera: ${woodCount}`

    updateToolButtonDisabled(
        toolFullRepairButton,
        coins < TOOL_COSTS.fullRepairCoins || woodCount < TOOL_COSTS.fullRepairWood || wall.life >= wall.maxLife
    )

    updateToolButtonDisabled(toolGrenadeButton, coins < TOOL_COSTS.grenade)
    updateToolButtonDisabled(toolTrapButton, coins < TOOL_COSTS.trap)
}

function showOverlay(title, subtitle, showStart, showRetry){
    overlayTitle.textContent = title
    overlaySubtitle.textContent = subtitle
    startBtn.classList.toggle("hidden", !showStart)
    retryBtn.classList.toggle("hidden", !showRetry)
    overlay.classList.remove("hidden")
}

function hideOverlay(){
    overlay.classList.add("hidden")
}

function showShop(){
    shopOpen = true
    gameRunning = false
    if(spawnTimer) clearInterval(spawnTimer)
    shopSubtitle.textContent = `Ronda ${round} lista. Tienes ${coins} monedas para mejorar.`
    shopOfferTypes = pickRandomShopOffers()
    updateShopButtons()
    shopOverlay.classList.remove("hidden")
}

function hideShop(){
    shopOpen = false
    shopOverlay.classList.add("hidden")
}

function resumeRoundAfterShop(){
    hideShop()
    gameRunning = true
    roundBanner = `Ronda ${round}`
    roundBannerAlpha = 1
    roundBannerTimer = 120
    updateSpawnTimer()
}

function clearReloadUI(){
    isReloading = false
    reloadProgress = 0
    reloadFill.style.width = "0%"
    reloadBox.classList.add("hidden")
}

function clearRepair(){
    isRepairing = false
    repairProgress = 0
}

function selectPistol(){
    activeWeapon = "pistol"
    updateUI()
}

function selectShotgun(){
    if(shotgunAmmo <= 0) return
    activeWeapon = "shotgun"
    clearReloadUI()
    updateUI()
}

function selectFlamethrower(){
    if(!upgrades.flameUnlocked || flameAmmo <= 0) return
    activeWeapon = "flame"
    clearReloadUI()
    updateUI()
}

function startRepair(){
    if(!gameRunning || gameOver || shopOpen || isRepairing) return
    if(gamePhase !== "wall") return
    if(woodCount <= 0 || wall.life >= wall.maxLife) return

    clearReloadUI()
    isRepairing = true
    repairStartTime = performance.now()
    repairProgress = 0
}

function cancelRepair(){
    clearRepair()
}

function startReload(){
    if(!gameRunning || gameOver || shopOpen || isReloading) return
    if(activeWeapon !== "pistol") return
    if(ammo >= getPistolMagazineSize() || magazineAmmo <= 0) return

    clearRepair()
    isReloading = true
    reloadStartTime = performance.now()
    reloadProgress = 0
    reloadBox.classList.remove("hidden")
}

function spawnMuzzleFlash(x, y, color){
    flashes.push({ x, y, radius: 8, maxRadius: 26, alpha: 1, color })
}

function spawnExplosion(x, y, color, count = 12){
    for(let index = 0; index < count; index++){
        const angle = (Math.PI * 2 * index) / count
        const speed = 1.5 + Math.random() * 2.8

        explosions.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 24,
            maxLife: 24,
            radius: 2 + Math.random() * 3,
            color
        })
    }
}

function spawnFlameBurst(originX, originY, aimDir){
    const aimX = aimDir ? aimDir.x : 0
    const aimY = aimDir ? aimDir.y : -1
    const speed = 5
    
    for(let index = 0; index < 5; index++){
        const baseVx = aimX * speed
        const baseVy = aimY * speed
        const spreadX = (Math.random() - 0.5) * 3
        const spreadY = (Math.random() - 0.5) * 3
        
        flameBursts.push({
            x: originX + spreadX * 2,
            y: originY + spreadY * 2,
            vx: baseVx + spreadX,
            vy: baseVy + spreadY,
            life: 12 + Math.floor(Math.random() * 8),
            maxLife: 18,
            radius: 6 + Math.random() * 6,
            color: Math.random() > 0.45 ? "#ff9f1c" : "#ff5e5b"
        })
    }
}

function createZombie(){
    const isRed = round >= 2 && Math.random() < Math.min(0.65, 0.25 + round * 0.04)
    const zombieSize = 30

    return {
        x: 0,
        y: 0,
        width: zombieSize,
        height: zombieSize,
        speed: isRed ? 1.4 + round * 0.04 : 1.8 + (round - 1) * 0.15,
        hp: isRed ? RED_ZOMBIE_HP : 1,
        maxHp: isRed ? RED_ZOMBIE_HP : 1,
        type: isRed ? "red" : "green",
        hitFlash: 0,
        coinReward: isRed ? 7 : 3,
        animSeed: Math.random() * Math.PI * 2
    }
}

function placeZombieByPhase(zombie){
    const size = zombie.width

    if(gamePhase === "arena"){
        const side = Math.floor(Math.random() * 4)

        if(side === 0){
            zombie.x = Math.random() * (WIDTH - size)
            zombie.y = -size
            return
        }

        if(side === 1){
            zombie.x = WIDTH + size
            zombie.y = Math.random() * (HEIGHT - size)
            return
        }

        if(side === 2){
            zombie.x = Math.random() * (WIDTH - size)
            zombie.y = HEIGHT + size
            return
        }

        zombie.x = -size
        zombie.y = Math.random() * (HEIGHT - size)
        return
    }

    zombie.x = Math.random() * (WIDTH - size)
    zombie.y = -size
}

function spawnZombie(){
    if(!gameRunning || gameOver || shopOpen) return
    if(transitionActive) return
    if(zombiesSpawned >= zombiesThisRound) return

    const zombie = createZombie()
    placeZombieByPhase(zombie)
    zombies.push(zombie)
    zombiesSpawned++
}

function awardDrops(centerX, centerY){
    ammoDrops.push({
        x: centerX,
        y: centerY,
        amount: Math.floor(Math.random() * 5) + 1
    })

    if(Math.random() < SHOTGUN_DROP_CHANCE){
        shotgunDrops.push({
            x: centerX,
            y: centerY,
            amount: SHOTGUN_DROP_AMOUNT
        })
    }

    const forceFlameDrop = killsSinceFlameDrop >= FLAME_DROP_PITY_KILLS
    if(forceFlameDrop || Math.random() < FLAME_DROP_CHANCE){
        flameDrops.push({
            x: centerX,
            y: centerY,
            amount: FLAME_DROP_AMOUNT
        })
        killsSinceFlameDrop = 0
    }

    if(Math.random() < WOOD_DROP_CHANCE){
        woodDrops.push({ x: centerX, y: centerY })
    }
}

function killZombie(index, zombie){
    zombies.splice(index, 1)
    zombiesProcessed++
    killsSinceFlameDrop++
    coins += zombie.coinReward

    const centerX = zombie.x + zombie.width / 2
    const centerY = zombie.y + zombie.height / 2

    awardDrops(centerX, centerY)
    spawnExplosion(centerX, centerY, zombie.type === "red" ? "#ff4444" : "#8dff5f", zombie.type === "red" ? 18 : 12)
    updateUI()
}

function damageZombie(index, zombie, damage){
    zombie.hp -= damage
    zombie.hitFlash = 8

    if(zombie.hp <= 0){
        killZombie(index, zombie)
        return true
    }

    return false
}

function firePistol(){
    if(ammo <= 0 || isReloading) return

    const originX = player.x + player.width / 2
    const originY = player.y + player.height / 2
    const bulletSpeed = getBulletSpeed(8)
    const aim = gamePhase === "arena" ? getAimDirection(originX, originY) : { x: 0, y: -1 }

    bullets.push({
        x: originX,
        y: originY,
        vx: aim.x * bulletSpeed,
        vy: aim.y * bulletSpeed,
        size: 4,
        damage: 1,
        color: "#ffe066"
    })

    spawnMuzzleFlash(originX, originY, "#ffe066")
    playerRecoil = Math.min(0.35, playerRecoil + 0.16)
    ammo--
    updateUI()

    if(ammo === 0){
        startReload()
    }
}

function fireShotgun(){
    if(shotgunAmmo <= 0) return

    const originX = player.x + player.width / 2
    const originY = player.y + player.height / 2
    const aim = gamePhase === "arena" ? getAimDirection(originX, originY) : { angle: -Math.PI / 2 }
    const baseAngle = aim.angle
    const angles = [baseAngle - 0.35, baseAngle, baseAngle + 0.35]
    const shotSpeed = getBulletSpeed(9)

    angles.forEach(angle => {
        const dirX = Math.cos(angle)
        const dirY = Math.sin(angle)
        bullets.push({
            x: originX,
            y: originY,
            vx: dirX * shotSpeed,
            vy: dirY * shotSpeed,
            size: 5,
            damage: 1,
            color: "#ff8fab"
        })
    })

    spawnMuzzleFlash(originX, originY, "#ff8fab")
    playerRecoil = Math.min(0.5, playerRecoil + 0.24)
    shotgunAmmo--

    if(shotgunAmmo <= 0){
        shotgunAmmo = 0
        activeWeapon = "pistol"
    }

    updateUI()
}

function fireFlamethrower(){
    if(!upgrades.flameUnlocked || flameAmmo <= 0) return

    const originX = player.x + player.width / 2
    const originY = player.y + player.height / 2
    const maxRange = upgrades.flameRange
    const aim = gamePhase === "arena" ? getAimDirection(originX, originY) : { x: 0, y: -1 }

    flameAmmo--
    spawnMuzzleFlash(originX, originY, "#ff9f1c")
    playerRecoil = Math.min(0.28, playerRecoil + 0.08)
    spawnFlameBurst(originX, originY, aim)

    for(let index = zombies.length - 1; index >= 0; index--){
        const zombie = zombies[index]
        const targetX = zombie.x + zombie.width / 2
        const targetY = zombie.y + zombie.height / 2
        const dx = targetX - originX
        const dy = targetY - originY
        const distance = Math.hypot(dx, dy)
        if(distance <= 0.001) continue

        const dirX = dx / distance
        const dirY = dy / distance
        const dot = dirX * aim.x + dirY * aim.y
        const angle = Math.acos(Math.min(1, Math.max(-1, dot)))

        if(distance <= maxRange && angle <= 0.65){
            damageZombie(index, zombie, upgrades.flamePower)
        }
    }

    if(flameAmmo <= 0){
        flameAmmo = 0
        activeWeapon = "pistol"
    }

    updateUI()
}

function shoot(now){
    if(now < nextShotTime || !gameRunning || gameOver || shopOpen || transitionActive) return

    clearRepair()

    if(activeWeapon === "shotgun") fireShotgun()
    else if(activeWeapon === "flame") fireFlamethrower()
    else firePistol()

    nextShotTime = now + getWeaponCooldown()
}

function processRepair(now){
    if(!isRepairing) return

    if(!keys.KeyD || wall.life >= wall.maxLife || woodCount <= 0){
        clearRepair()
        return
    }

    const elapsed = now - repairStartTime
    repairProgress = Math.min(elapsed / REPAIR_TIME_MS, 1)

    if(repairProgress >= 1){
        wall.life = Math.min(wall.life + REPAIR_AMOUNT, wall.maxLife)
        woodCount--
        clearRepair()
        updateUI()
    }
}

function processReload(now){
    if(!isReloading) return

    const elapsed = now - reloadStartTime
    reloadProgress = Math.min(elapsed / RELOAD_TIME_MS, 1)
    reloadFill.style.width = `${reloadProgress * 100}%`

    if(reloadProgress >= 1){
        const needed = getPistolMagazineSize() - ammo
        const loaded = Math.min(needed, magazineAmmo)
        ammo += loaded
        magazineAmmo -= loaded
        clearReloadUI()
        updateUI()
    }
}

function updateBullets(){
    for(let index = bullets.length - 1; index >= 0; index--){
        const bullet = bullets[index]
        bullet.x += bullet.vx
        bullet.y += bullet.vy

        if(bullet.y < -20 || bullet.x < -20 || bullet.x > WIDTH + 20 || bullet.y > HEIGHT + 20){
            bullets.splice(index, 1)
        }
    }
}

function processZombieBulletCollision(zombieIndex, zombie){
    for(let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--){
        const bullet = bullets[bulletIndex]

        if(
            bullet.x > zombie.x &&
            bullet.x < zombie.x + zombie.width &&
            bullet.y > zombie.y &&
            bullet.y < zombie.y + zombie.height
        ){
            bullets.splice(bulletIndex, 1)
            return damageZombie(zombieIndex, zombie, bullet.damage)
        }
    }

    return false
}

function processZombieWallHit(zombieIndex, zombie){
    if(gamePhase === "arena" || transitionActive) return false
    if(zombie.y + zombie.height <= wall.y) return false

    zombies.splice(zombieIndex, 1)
    zombiesProcessed++
    const baseDamage = zombie.type === "red" ? 20 : 10
    const reducedDamage = Math.max(4, baseDamage - wallFortLevel * 2)
    wall.life = Math.max(0, wall.life - reducedDamage)
    updateUI()

    if(wall.life <= 0){
        startArenaTransition()
    }

    return true
}

function processZombieFrontBarrierHit(zombieIndex, zombie){
    for(let barrierIndex = frontBarriers.length - 1; barrierIndex >= 0; barrierIndex--){
        const barrier = frontBarriers[barrierIndex]

        const hitBarrier = (
            zombie.x + zombie.width > barrier.x &&
            zombie.x < barrier.x + barrier.width &&
            zombie.y + zombie.height > barrier.y &&
            zombie.y < barrier.y + barrier.height
        )

        if(!hitBarrier) continue

        barrier.hp -= zombie.type === "red" ? 2 : 1
        zombies.splice(zombieIndex, 1)
        zombiesProcessed++

        if(barrier.hp <= 0){
            frontBarriers.splice(barrierIndex, 1)
        }

        return true
    }

    return false
}

function processZombieTrapHit(zombieIndex, zombie){
    for(let trapIndex = traps.length - 1; trapIndex >= 0; trapIndex--){
        const trap = traps[trapIndex]

        const hitTrap = (
            zombie.x + zombie.width > trap.x &&
            zombie.x < trap.x + trap.width &&
            zombie.y + zombie.height > trap.y &&
            zombie.y < trap.y + trap.height
        )

        if(!hitTrap) continue

        trap.durability--
        killZombie(zombieIndex, zombie)

        if(trap.durability <= 0){
            traps.splice(trapIndex, 1)
        }

        return true
    }

    return false
}

function moveZombieForCurrentPhase(zombie){
    if(gamePhase === "arena"){
        const playerCenterX = player.x + player.width / 2
        const playerCenterY = player.y + player.height / 2
        const zombieCenterX = zombie.x + zombie.width / 2
        const zombieCenterY = zombie.y + zombie.height / 2
        const dx = playerCenterX - zombieCenterX
        const dy = playerCenterY - zombieCenterY
        const distance = Math.max(0.001, Math.hypot(dx, dy))
        zombie.x += (dx / distance) * zombie.speed
        zombie.y += (dy / distance) * zombie.speed
        return
    }

    zombie.y += zombie.speed
}

function processZombieHits(index, zombie){
    const zombieDied = processZombieBulletCollision(index, zombie)
    if(zombieDied) return true

    if(!zombies[index]) return true

    if(processZombieFrontBarrierHit(index, zombie)) return true
    if(processZombieTrapHit(index, zombie)) return true

    const hitWall = processZombieWallHit(index, zombie)
    if(hitWall && gameOver) return true

    return false
}

function updateZombies(){
    for(let zombieIndex = zombies.length - 1; zombieIndex >= 0; zombieIndex--){
        const zombie = zombies[zombieIndex]
        if(!zombie) continue

        moveZombieForCurrentPhase(zombie)

        if(zombie.hitFlash > 0) zombie.hitFlash--

        processZombieHits(zombieIndex, zombie)
    }
}

function moveDropTowardPlayer(drop){
    drop.x += (player.x - drop.x) * 0.05
    drop.y += (player.y - drop.y) * 0.05
}

function collectDropGroup(dropArray, onCollect){
    for(let index = dropArray.length - 1; index >= 0; index--){
        const drop = dropArray[index]
        moveDropTowardPlayer(drop)

        if(Math.abs(drop.x - player.x) < 20 && Math.abs(drop.y - player.y) < 20){
            onCollect(drop)
            dropArray.splice(index, 1)
            updateUI()
        }
    }
}

function collectDrops(){
    collectDropGroup(woodDrops, () => {
        woodCount++
    })

    collectDropGroup(ammoDrops, ammoDrop => {
        magazineAmmo += ammoDrop.amount
    })

    collectDropGroup(shotgunDrops, shotgunDrop => {
        shotgunAmmo += shotgunDrop.amount
        if(activeWeapon !== "shotgun") activeWeapon = "shotgun"
    })

    collectDropGroup(flameDrops, flameDrop => {
        upgrades.flameUnlocked = true
        flameAmmo += flameDrop.amount
        if(activeWeapon !== "flame") activeWeapon = "flame"
    })
}

function updateEffects(deltaMs){
    playerRecoil *= 0.82
    if(playerRecoil < 0.01) playerRecoil = 0

    if(arenaShieldMs > 0){
        arenaShieldMs -= deltaMs
        if(arenaShieldMs < 0) arenaShieldMs = 0
    }

    for(let index = flashes.length - 1; index >= 0; index--){
        const flash = flashes[index]
        flash.radius += 3.5
        flash.alpha -= 0.08

        if(flash.radius >= flash.maxRadius || flash.alpha <= 0){
            flashes.splice(index, 1)
        }
    }

    for(let index = explosions.length - 1; index >= 0; index--){
        const explosion = explosions[index]
        explosion.x += explosion.vx
        explosion.y += explosion.vy
        explosion.vx *= 0.97
        explosion.vy *= 0.97
        explosion.life--

        if(explosion.life <= 0){
            explosions.splice(index, 1)
        }
    }

    for(let index = flameBursts.length - 1; index >= 0; index--){
        const flame = flameBursts[index]
        flame.x += flame.vx
        flame.y += flame.vy
        flame.life--
        flame.radius *= 0.96

        if(flame.life <= 0 || flame.radius <= 1){
            flameBursts.splice(index, 1)
        }
    }

    if(roundBannerTimer > 0){
        roundBannerTimer--
        roundBannerAlpha = roundBannerTimer / 80
    }
}

function applyArenaKnockback(){
    if(gamePhase !== "arena") return

    player.x += arenaKnockbackVX
    player.y += arenaKnockbackVY

    arenaKnockbackVX *= 0.82
    arenaKnockbackVY *= 0.82

    if(Math.abs(arenaKnockbackVX) < 0.02) arenaKnockbackVX = 0
    if(Math.abs(arenaKnockbackVY) < 0.02) arenaKnockbackVY = 0

    player.x = Math.max(0, Math.min(WIDTH - player.width, player.x))
    player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y))
}

function damagePlayerInArena(zombie){
    if(gamePhase !== "arena" || arenaShieldMs > 0) return

    arenaLife -= zombie.type === "red" ? 16 : 10
    arenaShieldMs = ARENA_HIT_SHIELD_MS

    const playerCenterX = player.x + player.width / 2
    const playerCenterY = player.y + player.height / 2
    const zombieCenterX = zombie.x + zombie.width / 2
    const zombieCenterY = zombie.y + zombie.height / 2
    const dx = playerCenterX - zombieCenterX
    const dy = playerCenterY - zombieCenterY
    const distance = Math.max(0.001, Math.hypot(dx, dy))
    const push = zombie.type === "red" ? 8 : 6
    arenaKnockbackVX += (dx / distance) * push
    arenaKnockbackVY += (dy / distance) * push

    updateUI()

    if(arenaLife <= 0){
        arenaLife = 0
        endGame()
    }
}

function processArenaZombiePlayerContact(){
    if(gamePhase !== "arena" || arenaShieldMs > 0) return

    const playerCenterX = player.x + player.width / 2
    const playerCenterY = player.y + player.height / 2
    const playerRadius = Math.min(player.width, player.height) * 0.42

    for(let index = zombies.length - 1; index >= 0; index--){
        const zombie = zombies[index]
        if(!zombie) continue

        const zombieCenterX = zombie.x + zombie.width / 2
        const zombieCenterY = zombie.y + zombie.height / 2
        const zombieRadius = Math.min(zombie.width, zombie.height) * 0.42
        const distance = Math.hypot(playerCenterX - zombieCenterX, playerCenterY - zombieCenterY)

        if(distance <= playerRadius + zombieRadius){
            damagePlayerInArena(zombie)
            return
        }
    }
}

function maybeAdvanceRound(){
    if(zombiesSpawned < zombiesThisRound || zombies.length > 0) return

    round++
    zombiesSpawned = 0
    zombiesProcessed = 0
    zombiesThisRound = zombiesForRound(round)
    roundBanner = `Ronda ${round}`
    roundBannerAlpha = 1
    roundBannerTimer = 120

    if(round >= SECRET_TOOLS_UNLOCK_ROUND){
        secretToolsUnlocked = true
    }

    updateUI()

    if(round % SHOP_INTERVAL === 0){
        showShop()
        return
    }

    updateSpawnTimer()
}

function buyUpgrade(type){
    if(isUpgradeMaxed(type)) return

    const cost = getUpgradeCost(type)

    if(coins < cost) return

    coins -= cost
    upgradeLevels[type]++

    if(type === "wall"){
        wall.maxLife += 10
        wall.life = Math.min(wall.life + 20, wall.maxLife)
        upgrades.wallMaxLife = wall.maxLife
    }

    if(type === "fireRate"){
        upgrades.fireRateLevel++
    }

    if(type === "pistolMag"){
        upgrades.pistolMagBonus += 2
        ammo += 2
        ammo = Math.min(ammo, getPistolMagazineSize())
    }

    if(type === "bulletSpeed"){
        upgrades.bulletSpeedMultiplier += 0.15
    }

    if(type === "flame"){
        upgrades.flameUnlocked = true
        upgrades.flameRange += 20
        upgrades.flamePower += 0.35
        flameAmmo += FLAME_BASE_AMMO / 2 + upgrades.flameFuelBonus
        if(activeWeapon !== "flame") activeWeapon = "flame"
    }

    if(type === "moveSpeed"){
        upgrades.moveSpeed += 0.75
        player.speed = upgrades.moveSpeed
    }

    updateUI()
}

function useToolFullRepair(){
    if(!secretToolsUnlocked) return
    if(coins < TOOL_COSTS.fullRepairCoins || woodCount < TOOL_COSTS.fullRepairWood) return
    if(wall.life >= wall.maxLife) return

    coins -= TOOL_COSTS.fullRepairCoins
    woodCount -= TOOL_COSTS.fullRepairWood
    wall.life = wall.maxLife
    updateUI()
}

function useToolGrenade(){
    if(!secretToolsUnlocked) return
    if(coins < TOOL_COSTS.grenade) return

    coins -= TOOL_COSTS.grenade
    grenades++
    updateUI()
}

function useToolTrap(){
    if(!secretToolsUnlocked) return
    if(coins < TOOL_COSTS.trap) return

    coins -= TOOL_COSTS.trap

    traps.push({
        x: wall.x,
        y: wall.y - 12,
        width: wall.width,
        height: 12,
        durability: 6,
        maxDurability: 6
    })

    updateUI()
}

function throwGrenade(){
    if(!gameRunning || gameOver || shopOpen) return
    if(grenades <= 0) return

    grenades--

    const centerX = player.x + player.width / 2
    const centerY = Math.max(80, wall.y - 55)
    const radius = 120

    for(let index = zombies.length - 1; index >= 0; index--){
        const zombie = zombies[index]
        const zx = zombie.x + zombie.width / 2
        const zy = zombie.y + zombie.height / 2
        const distance = Math.hypot(zx - centerX, zy - centerY)

        if(distance <= radius){
            damageZombie(index, zombie, 4)
        }
    }

    spawnExplosion(centerX, centerY, "#ffd166", 28)
    updateUI()
}

function movePlayer(){
    let axisX = 0
    if(keys.ArrowLeft) axisX -= 1
    if(keys.ArrowRight) axisX += 1

    let axisY = 0
    if(gamePhase === "arena"){
        if(keys.KeyA) axisX -= 1
        if(keys.KeyD) axisX += 1
        if(keys.KeyW || keys.ArrowUp) axisY -= 1
        if(keys.KeyS || keys.ArrowDown) axisY += 1
    }

    if(axisX !== 0){
        player.x += axisX * player.speed
        player.x = Math.max(0, Math.min(WIDTH - player.width, player.x))
    }

    if(axisY !== 0 && gamePhase === "arena"){
        player.y += axisY * player.speed
        player.y = Math.max(0, Math.min(HEIGHT - player.height, player.y))
    }
}

function shouldShootWithCurrentInput(){
    if(keys.Space) return true
    return gamePhase === "arena" && mouseDown
}

function update(now){
    renderTimeMs = now
    const deltaMs = Math.min(50, now - (update.lastNow || now))
    update.lastNow = now

    updateEffects(deltaMs)

    if(!gameRunning || gameOver || shopOpen) return

    if(transitionActive){
        processArenaTransition(deltaMs)
        return
    }

    movePlayer()
    applyArenaKnockback()

    processReload(now)
    processRepair(now)
    if(gamePhase === "wall") processWallUpgradeArea(deltaMs)
    if(shouldShootWithCurrentInput()) shoot(now)

    updateBullets()
    updateZombies()
    processArenaZombiePlayerContact()
    collectDrops()
    maybeAdvanceRound()
}

function drawWallUpgradeArea(){
    const progress = Math.min(wallUpgradeProgressMs / WALL_UPGRADE_TIME_MS, 1)
    const maxed = wallFortLevel >= MAX_WALL_FORT_LEVEL
    const nextWoodCost = getWallUpgradeWoodCost()
    const hasEnoughWood = woodCount >= nextWoodCost

    ctx.save()
    let zoneFill = "rgba(56,189,248,0.2)"
    let zoneStroke = "rgba(56,189,248,0.9)"
    if(maxed){
        zoneFill = "rgba(34,197,94,0.3)"
        zoneStroke = "rgba(34,197,94,0.9)"
    } else if(!hasEnoughWood){
        zoneFill = "rgba(127,29,29,0.25)"
        zoneStroke = "rgba(239,68,68,0.9)"
    }
    ctx.fillStyle = zoneFill
    ctx.strokeStyle = zoneStroke
    const pulse = 1 + Math.sin(renderTimeMs * 0.008) * 0.08
    ctx.lineWidth = 2 * pulse
    ctx.fillRect(wallUpgradeZone.x, wallUpgradeZone.y, wallUpgradeZone.width, wallUpgradeZone.height)
    ctx.strokeRect(wallUpgradeZone.x, wallUpgradeZone.y, wallUpgradeZone.width, wallUpgradeZone.height)

    if(!maxed){
        ctx.fillStyle = "rgba(15,23,42,0.8)"
        ctx.fillRect(wallUpgradeZone.x, wallUpgradeZone.y - 12, wallUpgradeZone.width, 7)
        ctx.fillStyle = "#38bdf8"
        ctx.fillRect(wallUpgradeZone.x, wallUpgradeZone.y - 12, wallUpgradeZone.width * progress, 7)
    }

    ctx.fillStyle = "#e2e8f0"
    ctx.font = "bold 11px Arial"
    ctx.textAlign = "center"
    let zoneText = ""
    if(maxed){
        zoneText = "FORT MAX"
    } else if(hasEnoughWood){
        zoneText = `MEJORA ${wallFortLevel}/${MAX_WALL_FORT_LEVEL} - ${nextWoodCost}M`
    } else {
        zoneText = `FALTA MADERA (${nextWoodCost})`
    }
    ctx.fillText(zoneText, wallUpgradeZone.x + wallUpgradeZone.width / 2, wallUpgradeZone.y + wallUpgradeZone.height / 2 + 4)
    ctx.textAlign = "left"
    ctx.restore()
}

function drawFrontBarriers(){
    frontBarriers.forEach(barrier => {
        const ratio = barrier.hp / barrier.maxHp
        let barrierColor = "#7f1d1d"
        if(ratio > 0.6) barrierColor = "#64748b"
        else if(ratio > 0.3) barrierColor = "#9f6a2b"
        ctx.fillStyle = barrierColor
        ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height)

        ctx.fillStyle = "#cbd5e1"
        for(let x = barrier.x + 4; x < barrier.x + barrier.width; x += 12){
            ctx.beginPath()
            ctx.moveTo(x, barrier.y + barrier.height)
            ctx.lineTo(x + 4, barrier.y)
            ctx.lineTo(x + 8, barrier.y + barrier.height)
            ctx.closePath()
            ctx.fill()
        }
    })
}

function drawZombie(zombie){
    const phase = renderTimeMs * 0.008 + zombie.animSeed
    const bobY = Math.sin(phase) * 1.8
    const wobble = Math.sin(phase * 0.75) * 0.06
    const squash = 1 + Math.sin(phase * 1.3) * 0.03

    const hit = zombie.hitFlash > 0
    const cacheKey = `zombie-${zombie.type}-${hit ? "hit" : "normal"}`
    const zombieImage = getSvgImage(cacheKey, buildZombieSvg(zombie.type, hit))
    const centerX = zombie.x + zombie.width / 2
    const centerY = zombie.y + zombie.height / 2 + bobY

    if(zombieImage.complete && zombieImage.naturalWidth > 0){
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(wobble)
        ctx.scale(squash, 1 / squash)
        ctx.drawImage(zombieImage, -zombie.width / 2, -zombie.height / 2, zombie.width, zombie.height)
        ctx.restore()
    } else {
        let fallbackColor = "#4d7a3e"
        if(zombie.type === "red") fallbackColor = "#8f2c2c"
        if(hit) fallbackColor = "#f3f4f6"
        const radius = Math.min(zombie.width, zombie.height) / 2 - 2

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(wobble)
        ctx.scale(squash, 1 / squash)

        ctx.fillStyle = fallbackColor
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = "rgba(0,0,0,0.28)"
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.arc(0, 0, radius - 2.4, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = fallbackColor
        ctx.beginPath()
        ctx.ellipse(-radius - 2.5, 1, 3.2, 4.6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(radius + 2.5, 1, 3.2, 4.6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    }

    if(zombie.type === "red"){
        const filled = (zombie.hp / zombie.maxHp) * zombie.width
        ctx.fillStyle = "#550000"
        ctx.fillRect(zombie.x, zombie.y + bobY - 7, zombie.width, 5)
        ctx.fillStyle = "#ff4444"
        ctx.fillRect(zombie.x, zombie.y + bobY - 7, filled, 5)
    }
}

function drawDrops(){
    ctx.fillStyle = "orange"
    ammoDrops.forEach(drop => {
        ctx.beginPath()
        ctx.arc(drop.x, drop.y, 6, 0, Math.PI * 2)
        ctx.fill()
    })

    woodDrops.forEach(drop => {
        ctx.fillStyle = "#8B5E3C"
        ctx.fillRect(drop.x - 8, drop.y - 8, 16, 16)
        ctx.fillStyle = "#c8845a"
        ctx.fillRect(drop.x - 6, drop.y - 6, 12, 4)
        ctx.fillRect(drop.x - 6, drop.y + 2, 12, 4)
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 8px Arial"
        ctx.textAlign = "center"
        ctx.fillText("M", drop.x, drop.y + 3)
        ctx.textAlign = "left"
    })

    shotgunDrops.forEach(drop => {
        ctx.fillStyle = "#ff66b3"
        ctx.beginPath()
        ctx.arc(drop.x, drop.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#111"
        ctx.font = "bold 10px Arial"
        ctx.fillText("SG", drop.x - 7, drop.y + 3)
    })

    flameDrops.forEach(drop => {
        ctx.fillStyle = "#ff7a18"
        ctx.beginPath()
        ctx.arc(drop.x, drop.y, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = "#2b1600"
        ctx.font = "bold 10px Arial"
        ctx.fillText("FL", drop.x - 7, drop.y + 3)
    })

    traps.forEach(trap => {
        const ratio = trap.durability / trap.maxDurability
        ctx.fillStyle = ratio > 0.5 ? "#9aa6b2" : "#ef4444"
        ctx.fillRect(trap.x, trap.y, trap.width, trap.height)

        ctx.fillStyle = "#d1d5db"
        for(let x = trap.x + 4; x < trap.x + trap.width; x += 10){
            ctx.beginPath()
            ctx.moveTo(x, trap.y + trap.height)
            ctx.lineTo(x + 4, trap.y)
            ctx.lineTo(x + 8, trap.y + trap.height)
            ctx.closePath()
            ctx.fill()
        }
    })
}

function drawFlameRange(){
    if(gamePhase !== "arena" || activeWeapon !== "flame") return
    
    const originX = player.x + player.width / 2
    const originY = player.y + player.height / 2
    const aim = getAimDirection(originX, originY)
    const maxRange = upgrades.flameRange
    const coneAngle = 0.65
    
    ctx.save()
    ctx.strokeStyle = "rgba(255, 159, 28, 0.4)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(originX, originY)
    
    const angle1 = Math.atan2(aim.y, aim.x) - coneAngle
    const angle2 = Math.atan2(aim.y, aim.x) + coneAngle
    
    ctx.lineTo(originX + Math.cos(angle1) * maxRange, originY + Math.sin(angle1) * maxRange)
    ctx.arc(originX, originY, maxRange, angle1, angle2)
    ctx.lineTo(originX, originY)
    ctx.stroke()
    
    ctx.fillStyle = "rgba(255, 159, 28, 0.05)"
    ctx.fill()
    ctx.restore()
}

function drawEffects(){
    flameBursts.forEach(flame => {
        ctx.save()
        ctx.globalAlpha = Math.max(flame.life / flame.maxLife, 0)
        ctx.fillStyle = flame.color
        ctx.beginPath()
        ctx.arc(flame.x, flame.y, flame.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    })

    flashes.forEach(flash => {
        ctx.save()
        ctx.globalAlpha = Math.max(flash.alpha, 0)
        ctx.fillStyle = flash.color
        ctx.beginPath()
        ctx.arc(flash.x, flash.y, flash.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    })

    explosions.forEach(explosion => {
        ctx.save()
        ctx.globalAlpha = Math.max(explosion.life / explosion.maxLife, 0)
        ctx.fillStyle = explosion.color
        ctx.beginPath()
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
    })
}

function drawPlayer(){
    const playerImage = getSvgImage(`player-${activeWeapon}`, buildPlayerSvg(activeWeapon))
    const centerX = player.x + player.width / 2
    const centerY = player.y + player.height / 2
    const idleBob = Math.sin(renderTimeMs * 0.01) * 1.2
    const breathScale = 1 + Math.sin(renderTimeMs * 0.012) * 0.02
    const recoilOffset = playerRecoil * 4
    const aimAngle = getAimAngle(centerX, centerY)
    const facingRotation = gamePhase === "arena" ? aimAngle + Math.PI / 2 : 0
    const shieldActive = gamePhase === "arena" && arenaShieldMs > 0

    if(playerImage.complete && playerImage.naturalWidth > 0){
        ctx.save()
        ctx.translate(centerX, centerY + idleBob + recoilOffset)
        ctx.rotate(facingRotation)
        ctx.scale(breathScale, 1 / breathScale)
        ctx.drawImage(playerImage, -player.width / 2, -player.height / 2, player.width, player.height)
        if(shieldActive){
            ctx.strokeStyle = "rgba(56,189,248,0.9)"
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(0, 0, player.width * 0.62, 0, Math.PI * 2)
            ctx.stroke()
        }
        ctx.restore()
    } else {
        let playerColor = "#4f8fff"
        if(activeWeapon === "shotgun") playerColor = "#f97393"
        if(activeWeapon === "flame") playerColor = "#ff9f1c"

        const radius = Math.min(player.width, player.height) / 2 - 3

        ctx.save()
        ctx.translate(centerX, centerY + idleBob + recoilOffset)
        ctx.rotate(facingRotation)
        ctx.scale(breathScale, 1 / breathScale)

        ctx.fillStyle = "#3b4656"
        ctx.beginPath()
        ctx.arc(0, 0, radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#2a3340"
        ctx.beginPath()
        ctx.arc(0, 0, radius - 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = playerColor
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(0, 0, radius + 2, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = "#4b5563"
        ctx.beginPath()
        ctx.ellipse(-radius - 3, 1, 4, 6, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(radius + 3, 1, 4, 6, 0, 0, Math.PI * 2)
        ctx.fill()

        if(shieldActive){
            ctx.strokeStyle = "rgba(56,189,248,0.9)"
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.arc(0, 0, radius + 8, 0, Math.PI * 2)
            ctx.stroke()
        }
        ctx.restore()
    }
}

function drawMouseCrosshair(){
    if(gamePhase !== "arena" || transitionActive) return

    ctx.save()
    ctx.strokeStyle = "rgba(226,232,240,0.9)"
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.arc(mouseX, mouseY, 10, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(mouseX - 14, mouseY)
    ctx.lineTo(mouseX - 5, mouseY)
    ctx.moveTo(mouseX + 5, mouseY)
    ctx.lineTo(mouseX + 14, mouseY)
    ctx.moveTo(mouseX, mouseY - 14)
    ctx.lineTo(mouseX, mouseY - 5)
    ctx.moveTo(mouseX, mouseY + 5)
    ctx.lineTo(mouseX, mouseY + 14)
    ctx.stroke()
    ctx.restore()
}

function drawProgressRings(){
    const centerX = player.x + player.width / 2
    const centerY = player.y + player.height / 2

    if(isReloading){
        ctx.strokeStyle = "#ffd166"
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(centerX, centerY, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * reloadProgress)
        ctx.stroke()
    }

    if(isRepairing){
        ctx.strokeStyle = "#8B5E3C"
        ctx.lineWidth = 5
        ctx.beginPath()
        ctx.arc(centerX, centerY, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * repairProgress)
        ctx.stroke()
        ctx.fillStyle = "#c8845a"
        ctx.font = "bold 11px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Reparando...", centerX, centerY - 44)
        ctx.textAlign = "left"
    }
}

function drawRoundBanner(){
    if(roundBannerTimer <= 0 || !roundBanner) return

    ctx.save()
    ctx.globalAlpha = Math.min(roundBannerAlpha, 1)
    ctx.textAlign = "center"
    ctx.fillStyle = "#ffd166"
    ctx.font = "bold 52px Arial"
    ctx.fillText(roundBanner, WIDTH / 2, HEIGHT / 2 - 20)
    ctx.fillStyle = "#ffffff"
    ctx.font = "22px Arial"
    ctx.fillText(`${zombiesForRound(round)} zombies`, WIDTH / 2, HEIGHT / 2 + 18)
    ctx.restore()
}

function draw(){
    ctx.clearRect(0, 0, WIDTH, HEIGHT)

    if(!gameRunning && !gameOver && !shopOpen) return

    if(gamePhase !== "arena"){
        const wallPct = Math.max(wall.life, 0) / wall.maxLife
        let wallColor = "#cc2222"
        if(wallPct > 0.5) wallColor = "#888"
        else if(wallPct > 0.25) wallColor = "#b06020"

        ctx.fillStyle = wallColor
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height)

        if(wallFortLevel > 0){
            ctx.fillStyle = "#d1d5db"
            for(let x = wall.x + 4; x < wall.x + wall.width; x += Math.max(10, 16 - wallFortLevel * 2)){
                ctx.beginPath()
                ctx.moveTo(x, wall.y)
                ctx.lineTo(x + 4, wall.y - (4 + wallFortLevel * 1.2))
                ctx.lineTo(x + 8, wall.y)
                ctx.closePath()
                ctx.fill()
            }
        }

        drawFrontBarriers()
        drawWallUpgradeArea()
    }

    drawPlayer()

    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2)
        ctx.fill()
    })

    zombies.forEach(drawZombie)
    drawDrops()
    drawFlameRange()
    drawEffects()
    drawProgressRings()
    drawRoundBanner()
    drawMouseCrosshair()
}

function gameLoop(){
    update(performance.now())
    draw()
    requestAnimationFrame(gameLoop)
}

function endGame(){
    gameOver = true
    gameRunning = false
    shopOpen = false
    if(spawnTimer) clearInterval(spawnTimer)
    setTimeout(() => {
        showOverlay("GAME OVER", `Llegaste a la ronda ${round} con ${coins} monedas`, false, true)
    }, 600)
}

document.addEventListener("keydown", event => {
    keys[event.code] = true

    if(!gameRunning || gameOver || shopOpen) return

    if(event.code === "Digit1") selectPistol()
    if(event.code === "Digit2") selectShotgun()
    if(event.code === "Digit3") selectFlamethrower()
    if(event.code === "KeyG") throwGrenade()
    if(event.code === "KeyR") startReload()
    if(event.code === "KeyD") startRepair()
})

document.addEventListener("keyup", event => {
    keys[event.code] = false

    if(event.code === "KeyD") cancelRepair()
})

canvas.addEventListener("mousemove", event => {
    refreshMouseFromEvent(event)
})

canvas.addEventListener("mousedown", event => {
    refreshMouseFromEvent(event)
    if(event.button === 0) mouseDown = true
})

canvas.addEventListener("mouseup", event => {
    if(event.button === 0) mouseDown = false
})

canvas.addEventListener("mouseleave", () => {
    mouseDown = false
})

document.addEventListener("mouseup", () => {
    mouseDown = false
})

weaponPistolButton.addEventListener("click", selectPistol)
weaponShotgunButton.addEventListener("click", selectShotgun)
weaponFlameButton.addEventListener("click", selectFlamethrower)

upgradeWallButton.addEventListener("click", () => buyUpgrade("wall"))
upgradeFireRateButton.addEventListener("click", () => buyUpgrade("fireRate"))
upgradePistolMagButton.addEventListener("click", () => buyUpgrade("pistolMag"))
upgradeBulletSpeedButton.addEventListener("click", () => buyUpgrade("bulletSpeed"))
upgradeFlameButton.addEventListener("click", () => buyUpgrade("flame"))
upgradeMoveSpeedButton.addEventListener("click", () => buyUpgrade("moveSpeed"))

toolFullRepairButton.addEventListener("click", useToolFullRepair)
toolGrenadeButton.addEventListener("click", useToolGrenade)
toolTrapButton.addEventListener("click", useToolTrap)

closeShopBtn.addEventListener("click", resumeRoundAfterShop)

startBtn.addEventListener("click", () => {
    hideOverlay()
    gameRunning = true
    initGame()
    roundBanner = "Ronda 1"
    roundBannerAlpha = 1
    roundBannerTimer = 120
})

retryBtn.addEventListener("click", () => {
    hideOverlay()
    gameRunning = true
    initGame()
    roundBanner = "Ronda 1"
    roundBannerAlpha = 1
    roundBannerTimer = 120
})

showOverlay("Zombie Wall Defense", "Protege la pared, gana monedas y compra mejoras cada 5 rondas", true, false)
gameLoop()
