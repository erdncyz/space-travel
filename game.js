const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const usernameInput = document.getElementById("usernameInput");
let viewportWidth = 1;
let viewportHeight = 1;
let renderScale = 1;

const meteorImage = new Image();
let meteorReady = false;
meteorImage.onload = () => {
	meteorReady = true;
};
meteorImage.src = "asset/ay.png";

const ufoImage = new Image();
let ufoReady = false;
ufoImage.onload = () => {
	ufoReady = true;
};
ufoImage.src = "asset/ufo.png";

const alienImage = new Image();
let alienReady = false;
alienImage.onload = () => {
	alienReady = true;
};
alienImage.src = "asset/ufo.png";

const lipsImage = new Image();
let lipsReady = false;
lipsImage.onload = () => {
	lipsReady = true;
};
lipsImage.src = "asset/kp1.png";

const starImage = new Image();
let starReady = false;
starImage.onload = () => {
	starReady = true;
};
starImage.src = "asset/star1.png";

const landingBgImage = new Image();
let landingBgReady = false;
landingBgImage.onload = () => {
	landingBgReady = true;
};
landingBgImage.src = "asset/landing.jpg";

const initialRadius = 20;
const player = {
	x: 0,
	y: 0,
	radius: initialRadius,
	velocity: 0,
};

const gravity = 0.35;
const lift = 10;
const playerIconSize = 64;

let score = 0;
let isGameOver = false;
let shakeTime = 0;
let shakeIntensity = 0;
let shakePhase = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;
let gameOverStart = 0;
const baseStageTarget = 15;
const stageTargetStep = 15;
let currentStage = 0;
let isStageComplete = false;
let stageCompleteStart = 0;
let isGameStarted = false;
let showLandingPage = true;
let showScoreboard = false;
let username = "";
let tempUsername = "";
let highScores = [];
let isTypingName = false;
let showConfirmHome = false;
let landingWarning = "";
let scoreboardSource = "landing";

const trail = [];
const maxTrailLength = 40;

const particles = [];
const maxParticles = 25;
const particleSpawnInterval = 450;
let lastParticleSpawn = 0;

const planets = [];
const maxPlanets = 2;
const planetSpawnInterval = 8000;
let lastPlanetSpawn = 0;
let shieldCount = 0;

const asteroids = [];
const maxAsteroids = 6;
const asteroidSpawnInterval = 1600;
let lastAsteroidSpawn = 0;

const ufos = [];
const maxUfos = 2;
const ufoSpawnInterval = 5200;
let lastUfoSpawn = 0;

const aliens = [];
const maxAliens = 3;
const alienSpawnInterval = 6800;
let lastAlienSpawn = 0;

const explosions = [];
const maxExplosions = 6;
const explosionPalettes = {
	shield: ["rgba(120, 255, 220, 0.95)", "rgba(140, 255, 240, 0.85)", "rgba(80, 200, 190, 0.9)", "rgba(200, 255, 240, 0.9)"],
	damage: ["rgba(140, 0, 20, 0.98)", "rgba(190, 10, 30, 0.95)", "rgba(220, 30, 50, 0.92)", "rgba(120, 0, 10, 0.9)"],
};

let lastCollectTime = Date.now();
let isPressing = false;
let targetX = 0;
let targetY = 0;
let lastTouchInteraction = 0;

let audioContext = null;
let ambienceGain = null;
let audioReady = false;
let lockedViewportSize = null;

const firebaseConfig = {
	apiKey: "AIzaSyDRK-W5dPJfCIauC9YlQSqy7yErTSI4PD0",
	authDomain: "space-travel-15474.firebaseapp.com",
	projectId: "space-travel-15474",
	storageBucket: "space-travel-15474.firebasestorage.app",
	messagingSenderId: "759810820973",
	appId: "1:759810820973:web:f19ab3fe1a41e61b1fa864",
};

const DEVICE_ID_STORAGE_KEY = "spaceTravelDeviceId";
const LEADERBOARD_REFRESH_MS = 15000;
const PLAYER_COLLECTION = "players";

let firebaseReady = false;
let firebaseDb = null;
let deviceId = "";
let leaderboardLoading = false;
let leaderboardLastFetch = 0;
let bestScoreCache = 0;
let bestLevelCache = 1;
let profileSyncChain = Promise.resolve();
let profileSyncTimer = null;
let latestProfileSyncPayload = null;

const getNativeInstallId = () => {
	try {
		if (typeof window.APP_INSTALL_ID === "string" && window.APP_INSTALL_ID.trim()) {
			return window.APP_INSTALL_ID.trim();
		}
	} catch (error) {
		// no-op
	}
	return "";
};

const getViewportSize = () => {
	if (lockedViewportSize) {
		return lockedViewportSize;
	}
	if (window.visualViewport) {
		return {
			width: Math.max(1, Math.floor(window.visualViewport.width)),
			height: Math.max(1, Math.floor(window.visualViewport.height)),
		};
	}
	return {
		width: Math.max(1, Math.floor(window.innerWidth)),
		height: Math.max(1, Math.floor(window.innerHeight)),
	};
};

const getStageTarget = (stageIndex) => {
	const level = Math.max(0, Math.floor(stageIndex));
	return baseStageTarget + (level * stageTargetStep);
};

const lockViewportForKeyboard = () => {
	const width = Math.max(1, Math.floor(viewportWidth || window.innerWidth));
	const height = Math.max(1, Math.floor(viewportHeight || window.innerHeight));
	lockedViewportSize = { width, height };
};

const unlockViewportForKeyboard = () => {
	lockedViewportSize = null;
};

const generateDeviceId = () => {
	if (window.crypto && typeof window.crypto.randomUUID === "function") {
		return window.crypto.randomUUID();
	}
	return `dev-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
};

const getOrCreateDeviceId = () => {
	const nativeInstallId = getNativeInstallId();
	if (nativeInstallId) {
		try {
			localStorage.setItem(DEVICE_ID_STORAGE_KEY, nativeInstallId);
		} catch (error) {
			// no-op
		}
		return nativeInstallId;
	}
	try {
		const stored = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
		if (stored) {
			return stored;
		}
	} catch (error) {
		// localStorage yoksa geçici id üret.
	}
	const created = generateDeviceId();
	try {
		localStorage.setItem(DEVICE_ID_STORAGE_KEY, created);
	} catch (error) {
		// Yazılamıyorsa geçici kullanım.
	}
	return created;
};

const sanitizeName = (name) => (name || "").trim().slice(0, 15);
const hasValidTempUsername = () => sanitizeName(tempUsername).length > 0;

const getPlayerDocRef = () => {
	if (!firebaseReady || !firebaseDb || !deviceId) {
		return null;
	}
	return firebaseDb.collection(PLAYER_COLLECTION).doc(deviceId);
};

const syncLocalLeaderboardName = (nextName) => {
	const clean = sanitizeName(nextName);
	if (!clean || highScores.length === 0) {
		return;
	}
	for (const entry of highScores) {
		if (entry.id === deviceId) {
			entry.name = clean;
			return;
		}
	}
};

const applyUsername = (nextName, { syncRemote = true } = {}) => {
	const clean = sanitizeName(nextName);
	tempUsername = clean;
	username = clean;
	landingWarning = "";
	syncLocalLeaderboardName(clean);
	if (syncRemote && clean) {
		void syncPlayerProfile({ name: clean, score: bestScoreCache, level: bestLevelCache });
	}
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseCssPx = (rawValue) => {
	const parsed = Number.parseFloat(rawValue);
	return Number.isFinite(parsed) ? parsed : 0;
};

const getSafeInsets = () => {
	const style = getComputedStyle(document.documentElement);
	return {
		top: parseCssPx(style.getPropertyValue("--safe-top")),
		right: parseCssPx(style.getPropertyValue("--safe-right")),
		bottom: parseCssPx(style.getPropertyValue("--safe-bottom")),
		left: parseCssPx(style.getPropertyValue("--safe-left")),
	};
};

const getUiScale = () => clamp(Math.min(viewportWidth, viewportHeight) / 430, 0.78, 1.12);

const getHeaderMetrics = () => {
	const scale = getUiScale();
	const safeInsets = getSafeInsets();
	return {
		scale,
		padding: Math.max(10, 16 * scale),
		topInset: safeInsets.top,
		height: Math.max(52, 60 * scale) + safeInsets.top,
	};
};

const getCenteredPopupRect = ({ maxWidth, baseHeight, minHeight = 160 }) => {
	const scale = getUiScale();
	const safeInsets = getSafeInsets();
	const horizontalMargin = Math.max(14, 20 * scale);
	const topMargin = safeInsets.top + Math.max(10, 16 * scale);
	const bottomMargin = safeInsets.bottom + Math.max(12, 18 * scale);
	const width = Math.min(maxWidth * scale, viewportWidth - horizontalMargin * 2);
	const maxHeight = Math.max(minHeight, viewportHeight - topMargin - bottomMargin);
	const height = clamp(baseHeight * scale, minHeight, maxHeight);
	const x = (viewportWidth - width) / 2;
	const y = clamp((viewportHeight - height) / 2, topMargin, viewportHeight - bottomMargin - height);
	return { x, y, width, height, scale };
};

const getLandingLayout = () => {
	const popup = getCenteredPopupRect({ maxWidth: 380, baseHeight: 320, minHeight: 250 });
	const horizontalPadding = clamp(30 * popup.scale, 18, 34);
	const inputHeight = clamp(40 * popup.scale, 36, 46);
	const gap = clamp(10 * popup.scale, 6, 12);
	const buttonHeight = clamp(42 * popup.scale, 38, 46);
	const bottomPadding = clamp(24 * popup.scale, 18, 28);
	const inputY = popup.y + clamp(145 * popup.scale, 120, popup.height - 140);
	const buttonY = popup.y + popup.height - bottomPadding - buttonHeight;
	const buttonWidth = Math.floor((popup.width - horizontalPadding * 2 - gap) / 2);
	return {
		popup,
		input: {
			x: popup.x + horizontalPadding,
			y: inputY,
			width: popup.width - horizontalPadding * 2,
			height: inputHeight,
		},
		playButton: {
			x: popup.x + horizontalPadding,
			y: buttonY,
			width: buttonWidth,
			height: buttonHeight,
		},
		scoreButton: {
			x: popup.x + horizontalPadding + buttonWidth + gap,
			y: buttonY,
			width: buttonWidth,
			height: buttonHeight,
		},
	};
};

const getScoreboardLayout = () => {
	const popup = getCenteredPopupRect({ maxWidth: 380, baseHeight: 400, minHeight: 300 });
	const buttonHeight = clamp(42 * popup.scale, 38, 46);
	const buttonWidth = Math.min(180 * popup.scale, popup.width - 48);
	return {
		popup,
		button: {
			x: viewportWidth / 2 - buttonWidth / 2,
			y: popup.y + popup.height - buttonHeight - clamp(18 * popup.scale, 12, 22),
			width: buttonWidth,
			height: buttonHeight,
		},
	};
};

const loadHighScores = async (force = false) => {
	if (!firebaseReady || !firebaseDb) {
		return;
	}
	const now = Date.now();
	if (!force && (leaderboardLoading || (now - leaderboardLastFetch < LEADERBOARD_REFRESH_MS && highScores.length > 0))) {
		return;
	}
	leaderboardLoading = true;
	try {
		const snapshot = await firebaseDb
			.collection(PLAYER_COLLECTION)
			.orderBy("bestScore", "desc")
			.limit(10)
			.get();
		highScores = snapshot.docs.map((doc) => {
			const data = doc.data() || {};
			return {
				id: doc.id,
				name: data.name || "Oyuncu",
				score: Number.isFinite(data.bestScore) ? data.bestScore : 0,
				level: Number.isFinite(data.bestLevel) ? data.bestLevel : 1,
			};
		});
		leaderboardLastFetch = now;
	} catch (error) {
		console.error("Leaderboard yüklenemedi", error);
	} finally {
		leaderboardLoading = false;
	}
};

const writePlayerProfile = async ({ name, score, level }) => {
	const playerRef = getPlayerDocRef();
	if (!playerRef) {
		return;
	}
	const cleanName = sanitizeName(name);
	if (!cleanName) {
		return;
	}
	const candidateScore = Math.max(0, Math.floor(score || 0));
	const candidateLevel = Math.max(1, Math.floor(level || 1));
	const snapshot = await playerRef.get();
	const current = snapshot.exists ? (snapshot.data() || {}) : {};
	const bestScore = Math.max(Number(current.bestScore) || 0, candidateScore);
	const bestLevel = Math.max(Number(current.bestLevel) || 1, candidateLevel);
	bestScoreCache = bestScore;
	bestLevelCache = bestLevel;
	await playerRef.set(
		{
			deviceId,
			name: cleanName,
			bestScore,
			bestLevel,
			updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
			createdAt: current.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
		},
		{ merge: true }
	);
	leaderboardLastFetch = 0;
};

const syncPlayerProfile = async (payload) => {
	latestProfileSyncPayload = payload;
	if (profileSyncTimer) {
		clearTimeout(profileSyncTimer);
	}
	profileSyncTimer = setTimeout(() => {
		const toSync = latestProfileSyncPayload;
		latestProfileSyncPayload = null;
		profileSyncChain = profileSyncChain
			.then(async () => {
				if (!toSync) {
					return;
				}
				try {
					await writePlayerProfile(toSync);
				} catch (error) {
					const shouldRetry = error && typeof error.code === "string" && error.code.includes("failed-precondition");
					if (shouldRetry) {
						await new Promise((resolve) => setTimeout(resolve, 140));
						await writePlayerProfile(toSync);
					} else {
						throw error;
					}
				}
			})
			.catch((error) => {
				console.error("Profil senkronize edilemedi", error);
			});
	}, 180);
};

const loadPlayerProfile = async () => {
	const playerRef = getPlayerDocRef();
	if (!playerRef) {
		return;
	}
	try {
		const snapshot = await playerRef.get();
		if (snapshot.exists) {
			const data = snapshot.data() || {};
			const savedName = sanitizeName(data.name);
			bestScoreCache = Math.max(0, Number(data.bestScore) || 0);
			bestLevelCache = Math.max(1, Number(data.bestLevel) || 1);
			if (savedName) {
				applyUsername(savedName, { syncRemote: false });
				showScoreboard = false;
			}
		}
	} catch (error) {
		console.error("Profil yüklenemedi", error);
	}
};

const initFirebase = async () => {
	if (!window.firebase) {
		return;
	}
	if (!firebase.apps.length) {
		firebase.initializeApp(firebaseConfig);
	}
	firebaseDb = firebase.firestore();
	firebaseReady = true;
	deviceId = getOrCreateDeviceId();
	await loadPlayerProfile();
	await loadHighScores(true);
};

const resizeCanvas = () => {
	const { width, height } = getViewportSize();
	viewportWidth = width;
	viewportHeight = height;
	renderScale = clamp(window.devicePixelRatio || 1, 1, 2.4);
	canvas.style.width = `${viewportWidth}px`;
	canvas.style.height = `${viewportHeight}px`;
	canvas.width = Math.max(1, Math.floor(viewportWidth * renderScale));
	canvas.height = Math.max(1, Math.floor(viewportHeight * renderScale));
	ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
	ctx.imageSmoothingEnabled = true;
	if (player.x === 0 && player.y === 0) {
		player.x = width * 0.3;
		player.y = height * 0.5;
		return;
	}
	player.x = clamp(player.x, player.radius, width - player.radius);
	player.y = clamp(player.y, player.radius, height - player.radius);
};

const randomInRange = (min, max) => min + Math.random() * (max - min);

const createExplosion = (x, y, intensity = 1, palette = "damage") => {
	if (!Number.isFinite(x) || !Number.isFinite(y)) {
		return;
	}
	const colors = explosionPalettes[palette] || explosionPalettes.damage;
	const particleCount = Math.round(18 + 12 * intensity);
	const particles = [];
	for (let i = 0; i < particleCount; i += 1) {
		const angle = Math.random() * Math.PI * 2;
		const speed = randomInRange(0.6, 2.2) * intensity;
		const life = randomInRange(18, 32) * intensity;
		particles.push({
			x,
			y,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed,
			life,
			maxLife: life,
			size: randomInRange(1.5, 3.8) * intensity,
			color: colors[Math.floor(Math.random() * colors.length)],
		});
	}

	explosions.push({
		x,
		y,
		age: 0,
		life: Math.round(26 + 14 * intensity),
		ringRadius: randomInRange(6, 10) * intensity,
		ringGrowth: randomInRange(2.5, 3.6) * intensity,
		ringColor: colors[0],
		particles,
	});

	if (explosions.length > maxExplosions) {
		explosions.shift();
	}
};

const drawCoverImage = (image) => {
	const canvasRatio = viewportWidth / viewportHeight;
	const imageRatio = image.width / image.height;
	let drawWidth = viewportWidth;
	let drawHeight = viewportHeight;
	let drawX = 0;
	let drawY = 0;
	if (imageRatio > canvasRatio) {
		drawWidth = viewportHeight * imageRatio;
		drawX = (viewportWidth - drawWidth) / 2;
	} else {
		drawHeight = viewportWidth / imageRatio;
		drawY = (viewportHeight - drawHeight) / 2;
	}
	ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

const spawnParticle = () => {
	if (particles.length >= maxParticles) {
		return;
	}
	particles.push({
		x: randomInRange(20, viewportWidth - 20),
		y: randomInRange(20, viewportHeight - 20),
		radius: randomInRange(3, 6),
		alpha: 1,
	});
};

const spawnAsteroid = (maxLimit = maxAsteroids) => {
	if (asteroids.length >= maxLimit) {
		return;
	}
	const fromRight = Math.random() > 0.5;
	const size = randomInRange(14, 28);
	asteroids.push({
		x: fromRight ? viewportWidth + size : randomInRange(0, viewportWidth),
		y: fromRight ? randomInRange(0, viewportHeight) : -size,
		radius: size,
		vx: fromRight ? -randomInRange(0.18, 0.45) : randomInRange(-0.18, 0.18),
		vy: fromRight ? randomInRange(-0.12, 0.12) : randomInRange(0.18, 0.45),
		spin: randomInRange(-0.025, 0.025),
		angle: randomInRange(0, Math.PI * 2),
	});
};

const spawnUfo = () => {
	if (ufos.length >= maxUfos) {
		return;
	}
	const fromLeft = Math.random() > 0.5;
	const size = randomInRange(24, 36);
	const y = randomInRange(viewportHeight * 0.2, viewportHeight * 0.8);
	ufos.push({
		x: fromLeft ? -size : viewportWidth + size,
		y,
		radius: size * 0.45,
		vx: fromLeft ? randomInRange(0.6, 1.2) : -randomInRange(0.6, 1.2),
		vy: randomInRange(-0.2, 0.2),
		bobOffset: Math.random() * Math.PI * 2,
		size,
	});
};

const spawnAlien = () => {
	if (aliens.length >= maxAliens) {
		return;
	}
	const fromLeft = Math.random() > 0.5;
	const size = randomInRange(16, 24);
	const y = randomInRange(viewportHeight * 0.15, viewportHeight * 0.85);
	aliens.push({
		x: fromLeft ? -size : viewportWidth + size,
		y,
		radius: size * 0.4,
		vx: fromLeft ? randomInRange(0.25, 0.55) : -randomInRange(0.25, 0.55),
		vy: randomInRange(-0.15, 0.15),
		bobOffset: Math.random() * Math.PI * 2,
		size,
		wanderAngle: Math.random() * Math.PI * 2,
	});
};

const spawnPlanet = () => {
	if (planets.length >= maxPlanets) {
		return;
	}
	planets.push({
		x: randomInRange(40, viewportWidth - 40),
		y: randomInRange(40, viewportHeight - 40),
		radius: randomInRange(12, 20),
		alpha: 1,
	});
};

const handlePressStart = (event) => {
	event.preventDefault();
	initAudio();
	if (showLandingPage) {
		return;
	}
	if (showScoreboard) {
		return;
	}
	const clientX = getPointerX(event);
	const clientY = getPointerY(event);
	if (showConfirmHome) {
		const { x, y } = getCanvasCoords(clientX, clientY);
		const { continueGame, home, restart, scoreboard } = getConfirmHomeButtons();
		if (
			x >= continueGame.x &&
			x <= continueGame.x + continueGame.width &&
			y >= continueGame.y &&
			y <= continueGame.y + continueGame.height
		) {
			showConfirmHome = false;
			return;
		}
		if (
			x >= home.x &&
			x <= home.x + home.width &&
			y >= home.y &&
			y <= home.y + home.height
		) {
			showConfirmHome = false;
			resetGame();
			showLandingPage = true;
			showScoreboard = false;
			scoreboardSource = "landing";
			usernameInput.blur();
			return;
		}
		if (
			x >= restart.x &&
			x <= restart.x + restart.width &&
			y >= restart.y &&
			y <= restart.y + restart.height
		) {
			showConfirmHome = false;
			resetGame();
			startGame();
			return;
		}
		if (
			x >= scoreboard.x &&
			x <= scoreboard.x + scoreboard.width &&
			y >= scoreboard.y &&
			y <= scoreboard.y + scoreboard.height
		) {
			showConfirmHome = false;
			showScoreboard = true;
			scoreboardSource = "pause";
			void loadHighScores(true);
			return;
		}
		return;
	}
	if (!isGameStarted) {
		startGame();
		return;
	}
	if (isStageComplete) {
		advanceStage();
		return;
	}
	if (isGameStarted) {
		const { x, y } = getCanvasCoords(clientX, clientY);
		const homeButton = getHomeButtonRect(shieldCount > 0);
		if (
			x >= homeButton.x &&
			x <= homeButton.x + homeButton.width &&
			y >= homeButton.y &&
			y <= homeButton.y + homeButton.height
		) {
			showConfirmHome = true;
			isPressing = false;
			return;
		}
	}
	isPressing = true;
	player.velocity = -lift;
	const pointerPos = getCanvasCoords(clientX, clientY);
	targetX = pointerPos.x;
	targetY = pointerPos.y;
	playWoosh();
};

const handlePressEnd = (event) => {
	event.preventDefault();
	isPressing = false;
};

const handlePointerMove = (event) => {
	if (!isPressing) {
		return;
	}
	event.preventDefault();
	const pointerPos = getCanvasCoords(getPointerX(event), getPointerY(event));
	targetX = pointerPos.x;
	targetY = pointerPos.y;
};

const getPointerX = (event) => {
	if (event.touches && event.touches[0]) {
		return event.touches[0].clientX;
	}
	if (event.changedTouches && event.changedTouches[0]) {
		return event.changedTouches[0].clientX;
	}
	return event.clientX;
};

const getPointerY = (event) => {
	if (event.touches && event.touches[0]) {
		return event.touches[0].clientY;
	}
	if (event.changedTouches && event.changedTouches[0]) {
		return event.changedTouches[0].clientY;
	}
	return event.clientY;
};

const getCanvasCoords = (clientX, clientY) => {
	const rect = canvas.getBoundingClientRect();
	return {
		x: clientX - rect.left,
		y: clientY - rect.top,
	};
};

const getHomeButtonRect = (shieldVisible) => {
	const { scale, padding, topInset } = getHeaderMetrics();
	const buttonWidth = clamp(110 * scale, 88, 126);
	const buttonHeight = clamp(32 * scale, 28, 38);
	const buttonY = topInset + Math.max(8, 14 * scale);
	const shieldBoxWidth = clamp(80 * scale, 66, 92);
	const gap = Math.max(8, 10 * scale);
	const rightEdge = shieldVisible
		? viewportWidth - padding - shieldBoxWidth - gap
		: viewportWidth - padding;
	const buttonX = rightEdge - buttonWidth;
	return {
		x: buttonX,
		y: buttonY,
		width: buttonWidth,
		height: buttonHeight,
	};
};

const getConfirmHomeButtons = () => {
	const popup = getCenteredPopupRect({ maxWidth: 320, baseHeight: 300, minHeight: 250 });
	const sidePadding = clamp(18 * popup.scale, 14, 22);
	const btnWidth = popup.width - sidePadding * 2;
	const btnHeight = clamp(38 * popup.scale, 34, 44);
	const firstY = popup.y + clamp(66 * popup.scale, 58, 78);
	const gap = clamp(10 * popup.scale, 8, 12);
	return {
		popup,
		continueGame: { x: popup.x + sidePadding, y: firstY, width: btnWidth, height: btnHeight },
		home: { x: popup.x + sidePadding, y: firstY + btnHeight + gap, width: btnWidth, height: btnHeight },
		restart: { x: popup.x + sidePadding, y: firstY + (btnHeight + gap) * 2, width: btnWidth, height: btnHeight },
		scoreboard: { x: popup.x + sidePadding, y: firstY + (btnHeight + gap) * 3, width: btnWidth, height: btnHeight },
	};
};

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
window.addEventListener("visibilitychange", () => {
	if (!document.hidden) {
		return;
	}
	isPressing = false;
	if (isTypingName) {
		closeUsernameEditor();
	}
	if (isGameStarted && !isGameOver && !showLandingPage && !showScoreboard && !showConfirmHome && !isStageComplete) {
		showConfirmHome = true;
	}
});
if (window.visualViewport) {
	window.visualViewport.addEventListener("resize", resizeCanvas);
	window.visualViewport.addEventListener("scroll", resizeCanvas);
}
canvas.addEventListener("mousedown", handlePressStart);
canvas.addEventListener("mouseup", handlePressEnd);
canvas.addEventListener("mouseleave", handlePressEnd);
canvas.addEventListener("mousemove", handlePointerMove);
canvas.addEventListener("touchstart", handlePressStart, { passive: false });
canvas.addEventListener("touchend", handlePressEnd, { passive: false });
canvas.addEventListener("touchcancel", handlePressEnd, { passive: false });
canvas.addEventListener("touchmove", handlePointerMove, { passive: false });

window.addEventListener("keydown", (e) => {
	if (showLandingPage) {
		if (document.activeElement === usernameInput) {
			return;
		}
		if (e.key === "Backspace") {
			e.preventDefault();
			tempUsername = tempUsername.slice(0, -1);
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (tempUsername.trim()) {
				applyUsername(tempUsername.trim());
				showLandingPage = false;
				usernameInput.blur();
			}
		} else if (e.key.length === 1 && tempUsername.length < 15) {
			tempUsername += e.key;
		}
	}
});

usernameInput.addEventListener("input", (e) => {
	if (showLandingPage) {
		tempUsername = sanitizeName(e.target.value);
		if (e.target.value !== tempUsername) {
			e.target.value = tempUsername;
		}
		if (tempUsername) {
			landingWarning = "";
		}
	}
});

usernameInput.addEventListener("focus", () => {
	isTypingName = true;
	lockViewportForKeyboard();
});

usernameInput.addEventListener("blur", () => {
	isTypingName = false;
	unlockViewportForKeyboard();
	resizeCanvas();
	usernameInput.style.pointerEvents = "none";
	usernameInput.style.opacity = "0";
	usernameInput.style.background = "transparent";
	usernameInput.style.border = "none";
	usernameInput.style.color = "#fff";
	if (showLandingPage && tempUsername.trim()) {
		applyUsername(tempUsername.trim());
	}
});

const closeUsernameEditor = () => {
	isTypingName = false;
	unlockViewportForKeyboard();
	usernameInput.blur();
	resizeCanvas();
	usernameInput.style.pointerEvents = "none";
	usernameInput.style.opacity = "0";
	usernameInput.style.background = "transparent";
	usernameInput.style.border = "none";
	usernameInput.style.color = "#fff";
};

const handleLandingInteraction = (clientX, clientY) => {
	const rect = canvas.getBoundingClientRect();
	const x = clientX - rect.left;
	const y = clientY - rect.top;
	if (showLandingPage) {
		const layout = getLandingLayout();
		const { input, playButton, scoreButton } = layout;

		if (x >= input.x && x <= input.x + input.width && y >= input.y && y <= input.y + input.height) {
			usernameInput.style.pointerEvents = "auto";
			usernameInput.style.opacity = "1";
			usernameInput.style.left = `${rect.left + input.x}px`;
			usernameInput.style.top = `${rect.top + input.y}px`;
			usernameInput.style.width = `${input.width}px`;
			usernameInput.style.height = `${input.height}px`;
			usernameInput.style.background = "rgba(18, 24, 38, 0.9)";
			usernameInput.style.border = "1.5px solid rgba(122, 208, 255, 0.95)";
			usernameInput.style.color = "rgba(240, 246, 255, 0.98)";
			usernameInput.value = tempUsername;
			usernameInput.focus();
			landingWarning = "";
			return;
		}

		if (
			x >= playButton.x &&
			x <= playButton.x + playButton.width &&
			y >= playButton.y &&
			y <= playButton.y + playButton.height
		) {
			if (hasValidTempUsername()) {
				applyUsername(tempUsername.trim());
				showLandingPage = false;
				closeUsernameEditor();
			} else {
				landingWarning = "Kullanıcı adı boş bırakılamaz.";
			}
		}

		if (
			x >= scoreButton.x &&
			x <= scoreButton.x + scoreButton.width &&
			y >= scoreButton.y &&
			y <= scoreButton.y + scoreButton.height
		) {
			showLandingPage = false;
			showScoreboard = true;
			scoreboardSource = "landing";
			void loadHighScores(true);
			closeUsernameEditor();
		}
	} else if (showScoreboard) {
		const { button } = getScoreboardLayout();

		if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
			showScoreboard = false;
			closeUsernameEditor();
			if (scoreboardSource === "pause") {
				showConfirmHome = true;
			} else {
				showLandingPage = true;
			}
		}
	}
};

canvas.addEventListener("click", (e) => {
	if (Date.now() - lastTouchInteraction < 450) {
		return;
	}
	handleLandingInteraction(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => {
	lastTouchInteraction = Date.now();
	const touch = e.touches[0];
	if (!touch) {
		return;
	}
	handleLandingInteraction(touch.clientX, touch.clientY);
}, { passive: false });

const update = () => {
	if (isGameOver) {
		return;
	}
	if (!isGameStarted) {
		return;
	}
	if (isStageComplete) {
		return;
	}
	if (showScoreboard) {
		return;
	}
	if (showConfirmHome) {
		return;
	}
	const now = Date.now();
	if (isPressing) {
		player.velocity *= 0.4;
		player.x += (targetX - player.x) * 0.25;
		player.y += (targetY - player.y) * 0.25;
	} else {
		player.velocity += gravity;
		player.y += player.velocity;
	}

	const topLimit = player.radius;
	const bottomLimit = viewportHeight - player.radius;
	const leftLimit = player.radius;
	const rightLimit = viewportWidth - player.radius;

	if (player.y < topLimit) {
		player.y = topLimit;
		player.velocity = 0;
	}

	if (player.x < leftLimit) {
		player.x = leftLimit;
	}

	if (player.x > rightLimit) {
		player.x = rightLimit;
	}

	if (player.y > bottomLimit) {
		player.y = bottomLimit;
		player.velocity = Math.min(player.velocity, 0);
	}

	trail.push({
		x: player.x,
		y: player.y,
		radius: player.radius,
		alpha: 1,
	});

	if (trail.length > maxTrailLength) {
		trail.shift();
	}

	for (const point of trail) {
		point.alpha = Math.max(0, point.alpha - 0.03);
	}

	if (now - lastParticleSpawn > particleSpawnInterval) {
		spawnParticle();
		lastParticleSpawn = now;
	}

	if (now - lastPlanetSpawn > planetSpawnInterval) {
		spawnPlanet();
		lastPlanetSpawn = now;
	}

	const isShieldSurge = shieldCount > 10;
	const asteroidInterval = isShieldSurge ? Math.max(700, asteroidSpawnInterval * 0.7) : asteroidSpawnInterval;
	const asteroidLimit = isShieldSurge ? Math.max(maxAsteroids + 2, Math.round(maxAsteroids * 1.5)) : maxAsteroids;
	if (now - lastAsteroidSpawn > asteroidInterval) {
		spawnAsteroid(asteroidLimit);
		lastAsteroidSpawn = now;
	}

	const isUfoStage = currentStage >= 3;
	if (isUfoStage && now - lastUfoSpawn > ufoSpawnInterval) {
		spawnUfo();
		lastUfoSpawn = now;
	}

	const isAlienStage = currentStage >= 4;
	if (isAlienStage && now - lastAlienSpawn > alienSpawnInterval) {
		spawnAlien();
		lastAlienSpawn = now;
	}

	for (let i = particles.length - 1; i >= 0; i -= 1) {
		const particle = particles[i];
		particle.alpha = Math.max(0, particle.alpha - 0.002);
		const dx = player.x - particle.x;
		const dy = player.y - particle.y;
		const distance = Math.hypot(dx, dy);
		if (distance < player.radius + particle.radius) {
			lastCollectTime = now;
			score += 1;
			shakeTime = 4;
			shakeIntensity = 1.6;
			playTing();
			particles.splice(i, 1);
			checkStageComplete();
		} else if (particle.alpha <= 0) {
			particles.splice(i, 1);
		}
	}

	for (let i = planets.length - 1; i >= 0; i -= 1) {
		const planet = planets[i];
		const dx = player.x - planet.x;
		const dy = player.y - planet.y;
		const distance = Math.hypot(dx, dy);
		if (distance < player.radius + planet.radius) {
			shieldCount += 1;
			shakeTime = 5;
			shakeIntensity = 2.2;
			playTing();
			planets.splice(i, 1);
			checkStageComplete();
		}
	}

	for (let i = asteroids.length - 1; i >= 0; i -= 1) {
		const asteroid = asteroids[i];
		const steerX = (player.x - asteroid.x) * 0.00015;
		const steerY = (player.y - asteroid.y) * 0.00015;
		asteroid.vx += steerX;
		asteroid.vy += steerY;
		asteroid.x += asteroid.vx;
		asteroid.y += asteroid.vy;
		asteroid.angle += asteroid.spin;

		const dx = player.x - asteroid.x;
		const dy = player.y - asteroid.y;
		const distance = Math.hypot(dx, dy);
		if (distance < player.radius + asteroid.radius) {
			if (shieldCount > 0) {
				createExplosion(player.x, player.y, 0.95, "damage");
				shieldCount -= 1;
				asteroids.splice(i, 1);
				shakeTime = 10;
				shakeIntensity = 8;
				continue;
			}
			createExplosion(player.x, player.y, 1.2, "damage");
			isGameOver = true;
			gameOverStart = Date.now();
			playGameOver();
			break;
		}

		if (
			asteroid.x < -60 ||
			asteroid.x > viewportWidth + 60 ||
			asteroid.y < -60 ||
			asteroid.y > viewportHeight + 60
		) {
			asteroids.splice(i, 1);
		}
	}

	for (let i = ufos.length - 1; i >= 0; i -= 1) {
		const ufo = ufos[i];
		const bob = Math.sin((now / 350) + ufo.bobOffset) * 0.6;
		ufo.x += ufo.vx;
		ufo.y += ufo.vy + bob;

		const dx = player.x - ufo.x;
		const dy = player.y - ufo.y;
		const distance = Math.hypot(dx, dy);
		if (distance < player.radius + ufo.radius) {
			if (shieldCount > 0) {
				createExplosion(player.x, player.y, 1, "damage");
				shieldCount -= 1;
				ufos.splice(i, 1);
				shakeTime = 12;
				shakeIntensity = 10;
				continue;
			}
			createExplosion(player.x, player.y, 1.35, "damage");
			isGameOver = true;
			gameOverStart = Date.now();
			playGameOver();
			break;
		}

		if (ufo.x < -80 || ufo.x > viewportWidth + 80 || ufo.y < -80 || ufo.y > viewportHeight + 80) {
			ufos.splice(i, 1);
		}
	}

	for (let i = aliens.length - 1; i >= 0; i -= 1) {
		const alien = aliens[i];
		const bob = Math.sin((now / 500) + alien.bobOffset) * 0.4;
		alien.wanderAngle += randomInRange(-0.08, 0.08);
		const wanderVx = Math.cos(alien.wanderAngle) * 0.12;
		const wanderVy = Math.sin(alien.wanderAngle) * 0.08;
		alien.x += alien.vx + wanderVx;
		alien.y += alien.vy + wanderVy + bob;

		const dx = player.x - alien.x;
		const dy = player.y - alien.y;
		const distance = Math.hypot(dx, dy);
		if (distance < player.radius + alien.radius) {
			if (shieldCount > 0) {
				createExplosion(player.x, player.y, 0.9, "damage");
				shieldCount -= 1;
				aliens.splice(i, 1);
				shakeTime = 10;
				shakeIntensity = 8;
				continue;
			}
			createExplosion(player.x, player.y, 1.25, "damage");
			isGameOver = true;
			gameOverStart = Date.now();
			playGameOver();
			break;
		}

		if (alien.x < -80 || alien.x > viewportWidth + 80 || alien.y < -80 || alien.y > viewportHeight + 80) {
			aliens.splice(i, 1);
		}
	}

	for (let i = explosions.length - 1; i >= 0; i -= 1) {
		const explosion = explosions[i];
		explosion.age += 1;
		explosion.ringRadius += explosion.ringGrowth;
		for (let j = explosion.particles.length - 1; j >= 0; j -= 1) {
			const particle = explosion.particles[j];
			particle.x += particle.vx;
			particle.y += particle.vy;
			particle.vx *= 0.96;
			particle.vy *= 0.96;
			particle.life -= 1;
			if (particle.life <= 0) {
				explosion.particles.splice(j, 1);
			}
		}
		if (explosion.age > explosion.life && explosion.particles.length === 0) {
			explosions.splice(i, 1);
		}
	}

	if (now - lastCollectTime > 2000 && player.radius > initialRadius) {
		player.radius = Math.max(initialRadius, player.radius - 0.05);
	}
};

const getLevelLabel = (radius) => {
	if (radius < 20) {
		return "Kıvılcım";
	}
	if (radius < 40) {
		return "Yıldız";
	}
	if (radius < 70) {
		return "Süpernova";
	}
	return "Galaksi";
};

const drawExplosions = () => {
	for (const explosion of explosions) {
		const ringAlpha = Math.max(0, 1 - explosion.age / explosion.life);
		if (ringAlpha > 0) {
			ctx.save();
			ctx.globalAlpha = 0.7 * ringAlpha;
			ctx.strokeStyle = explosion.ringColor;
			ctx.lineWidth = Math.max(1, 4 * ringAlpha);
			ctx.shadowColor = explosion.ringColor;
			ctx.shadowBlur = 18 * ringAlpha;
			ctx.beginPath();
			ctx.arc(explosion.x, explosion.y, explosion.ringRadius, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}
		for (const particle of explosion.particles) {
			const lifeRatio = Math.max(0, particle.life / particle.maxLife);
			ctx.save();
			ctx.globalAlpha = lifeRatio;
			ctx.fillStyle = particle.color;
			ctx.shadowColor = particle.color;
			ctx.shadowBlur = 12 * lifeRatio;
			ctx.beginPath();
			ctx.arc(particle.x, particle.y, particle.size * (0.6 + 0.6 * lifeRatio), 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		}
	}
};

const draw = () => {
	ctx.clearRect(0, 0, viewportWidth, viewportHeight);
	if (showLandingPage && landingBgReady) {
		ctx.save();
		ctx.globalCompositeOperation = "source-over";
		ctx.filter = "saturate(1.25) contrast(1.12) brightness(1.05)";
		drawCoverImage(landingBgImage);
		ctx.filter = "none";
		const grade = ctx.createLinearGradient(0, 0, 0, viewportHeight);
		grade.addColorStop(0, "rgba(20, 10, 40, 0.15)");
		grade.addColorStop(0.5, "rgba(10, 20, 40, 0.05)");
		grade.addColorStop(1, "rgba(0, 0, 0, 0.35)");
		ctx.fillStyle = grade;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.globalCompositeOperation = "lighter";
		const neon1 = ctx.createRadialGradient(
			viewportWidth * 0.15,
			viewportHeight * 0.2,
			0,
			viewportWidth * 0.15,
			viewportHeight * 0.2,
			Math.max(viewportWidth, viewportHeight) * 0.35
		);
		neon1.addColorStop(0, "rgba(255, 200, 120, 0.28)");
		neon1.addColorStop(1, "rgba(255, 200, 120, 0)");
		ctx.fillStyle = neon1;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);

		const neon2 = ctx.createRadialGradient(
			viewportWidth * 0.85,
			viewportHeight * 0.25,
			0,
			viewportWidth * 0.85,
			viewportHeight * 0.25,
			Math.max(viewportWidth, viewportHeight) * 0.3
		);
		neon2.addColorStop(0, "rgba(120, 200, 255, 0.25)");
		neon2.addColorStop(1, "rgba(120, 200, 255, 0)");
		ctx.fillStyle = neon2;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);

		const neon3 = ctx.createRadialGradient(
			viewportWidth * 0.5,
			viewportHeight * 0.85,
			0,
			viewportWidth * 0.5,
			viewportHeight * 0.85,
			Math.max(viewportWidth, viewportHeight) * 0.28
		);
		neon3.addColorStop(0, "rgba(255, 140, 220, 0.2)");
		neon3.addColorStop(1, "rgba(255, 140, 220, 0)");
		ctx.fillStyle = neon3;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.globalCompositeOperation = "source-over";
		const vignette = ctx.createRadialGradient(
			viewportWidth / 2,
			viewportHeight / 2,
			Math.min(viewportWidth, viewportHeight) * 0.2,
			viewportWidth / 2,
			viewportHeight / 2,
			Math.max(viewportWidth, viewportHeight) * 0.7
		);
		vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
		vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
		ctx.fillStyle = vignette;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();
	}
	ctx.save();
	ctx.globalCompositeOperation = "lighter";

	if (shakeTime > 0) {
		shakePhase += 0.55;
		const targetX = Math.sin(shakePhase) * shakeIntensity;
		const targetY = Math.cos(shakePhase * 1.3) * shakeIntensity * 0.65;
		shakeOffsetX += (targetX - shakeOffsetX) * 0.4;
		shakeOffsetY += (targetY - shakeOffsetY) * 0.4;
		ctx.translate(shakeOffsetX, shakeOffsetY);
		shakeTime -= 1;
		shakeIntensity *= 0.84;
	} else if (Math.abs(shakeOffsetX) > 0.01 || Math.abs(shakeOffsetY) > 0.01) {
		shakeOffsetX *= 0.75;
		shakeOffsetY *= 0.75;
		ctx.translate(shakeOffsetX, shakeOffsetY);
	}

	const visibleTrail = trail.filter((point) => point.alpha > 0);
	if (visibleTrail.length > 1) {
		const tail = visibleTrail[0];
		const head = visibleTrail[visibleTrail.length - 1];
		const gradient = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
		gradient.addColorStop(0, "rgba(120, 200, 255, 0)");
		gradient.addColorStop(1, "rgba(120, 200, 255, 0.7)");

		ctx.beginPath();
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = gradient;
		ctx.shadowColor = "rgba(120, 200, 255, 0.8)";
		ctx.shadowBlur = 18;
		ctx.lineWidth = Math.max(2, player.radius * 0.8);
		ctx.moveTo(visibleTrail[0].x, visibleTrail[0].y);
		for (let i = 1; i < visibleTrail.length; i += 1) {
			const point = visibleTrail[i];
			ctx.lineTo(point.x, point.y);
		}
		ctx.stroke();
	}

	const pulse = 0.08 * Math.sin(Date.now() / 500);
	for (const particle of particles) {
		const size = particle.radius * (4.5 + pulse);
		const glow = Math.min(1, particle.alpha * (1 + pulse));
		ctx.save();
		ctx.globalAlpha = glow;
		ctx.shadowColor = `rgba(255, 230, 170, ${Math.min(1, glow + 0.2)})`;
		ctx.shadowBlur = 22 + 10 * pulse;
		if (starReady) {
			ctx.drawImage(starImage, particle.x - size / 2, particle.y - size / 2, size, size);
		} else {
			ctx.beginPath();
			ctx.fillStyle = `rgba(255, 210, 120, ${glow})`;
			ctx.arc(particle.x, particle.y, size / 2.5, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}

	for (const planet of planets) {
		ctx.save();
		const coreGradient = ctx.createRadialGradient(
			planet.x - planet.radius * 0.3,
			planet.y - planet.radius * 0.3,
			planet.radius * 0.2,
			planet.x,
			planet.y,
			planet.radius
		);
		coreGradient.addColorStop(0, "rgba(200, 255, 240, 0.95)");
		coreGradient.addColorStop(1, "rgba(60, 180, 200, 0.9)");
		ctx.beginPath();
		ctx.fillStyle = coreGradient;
		ctx.shadowColor = "rgba(120, 255, 220, 0.8)";
		ctx.shadowBlur = 20;
		ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
		ctx.fill();

		ctx.beginPath();
		ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
		ctx.arc(planet.x - planet.radius * 0.25, planet.y - planet.radius * 0.25, planet.radius * 0.2, 0, Math.PI * 2);
		ctx.fill();

		ctx.beginPath();
		ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
		ctx.lineWidth = Math.max(1.5, planet.radius * 0.15);
		ctx.ellipse(
			planet.x,
			planet.y,
			planet.radius * 1.6,
			planet.radius * 0.6,
			Math.PI / 6,
			0,
			Math.PI * 2
		);
		ctx.stroke();
		ctx.restore();
	}

	for (const asteroid of asteroids) {
		ctx.save();
		ctx.translate(asteroid.x, asteroid.y);
		ctx.rotate(asteroid.angle);
		if (meteorReady) {
			const size = asteroid.radius * 2.9;
			ctx.shadowColor = "rgba(255, 170, 120, 0.95)";
			ctx.shadowBlur = 22;
			ctx.filter = "grayscale(100%) brightness(0.8) saturate(0.2)";
			ctx.drawImage(meteorImage, -size / 2, -size / 2, size, size);
			ctx.filter = "none";
		} else {
			const baseGray = "rgba(90, 90, 90, 0.95)";

			ctx.beginPath();
			ctx.moveTo(-asteroid.radius * 0.6, -asteroid.radius * 0.4);
			ctx.lineTo(asteroid.radius * 0.7, -asteroid.radius * 0.6);
			ctx.lineTo(asteroid.radius * 0.9, 0);
			ctx.lineTo(asteroid.radius * 0.5, asteroid.radius * 0.7);
			ctx.lineTo(-asteroid.radius * 0.5, asteroid.radius * 0.5);
			ctx.closePath();
			ctx.fillStyle = baseGray;
			ctx.fill();

			ctx.beginPath();
			ctx.strokeStyle = "rgba(80, 80, 80, 0.6)";
			ctx.lineWidth = Math.max(1, asteroid.radius * 0.12);
			ctx.arc(0, 0, asteroid.radius * 0.95, 0, Math.PI * 2);
			ctx.stroke();

			for (let i = 0; i < 6; i += 1) {
				const craterX = (Math.random() - 0.5) * asteroid.radius * 1.2;
				const craterY = (Math.random() - 0.5) * asteroid.radius * 1.2;
				const craterR = asteroid.radius * (0.08 + Math.random() * 0.18);
				ctx.beginPath();
				ctx.fillStyle = "rgba(65, 65, 65, 0.85)";
				ctx.arc(craterX, craterY, craterR, 0, Math.PI * 2);
				ctx.fill();
				ctx.beginPath();
				ctx.strokeStyle = "rgba(95, 95, 95, 0.45)";
				ctx.lineWidth = Math.max(0.6, craterR * 0.2);
				ctx.arc(craterX, craterY, craterR * 1.1, 0, Math.PI * 2);
				ctx.stroke();
			}
		}

		ctx.restore();
	}

	for (const ufo of ufos) {
		ctx.save();
		ctx.translate(ufo.x, ufo.y);
		if (ufoReady) {
			const size = ufo.size * 2.4;
			ctx.shadowColor = "rgba(140, 220, 255, 0.9)";
			ctx.shadowBlur = 20;
			ctx.drawImage(ufoImage, -size / 2, -size / 2, size, size);
		} else {
			ctx.beginPath();
			ctx.fillStyle = "rgba(160, 220, 255, 0.9)";
			ctx.shadowColor = "rgba(120, 200, 255, 0.8)";
			ctx.shadowBlur = 18;
			ctx.ellipse(0, 0, ufo.radius * 1.6, ufo.radius * 0.9, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.fillStyle = "rgba(220, 255, 255, 0.9)";
			ctx.arc(0, -ufo.radius * 0.4, ufo.radius * 0.55, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}

	for (const alien of aliens) {
		ctx.save();
		ctx.translate(alien.x, alien.y);
		if (alienReady) {
			const size = alien.size * 2.2;
			ctx.shadowColor = "rgba(200, 255, 100, 0.95)";
			ctx.shadowBlur = 22;
			ctx.drawImage(alienImage, -size / 2, -size / 2, size, size);
		} else {
			ctx.beginPath();
			ctx.fillStyle = "rgba(200, 255, 80, 0.95)";
			ctx.shadowColor = "rgba(180, 255, 60, 0.95)";
			ctx.shadowBlur = 22;
			ctx.arc(0, 0, alien.radius * 1.1, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.fillStyle = "rgba(150, 220, 50, 0.9)";
			ctx.arc(0, -alien.radius * 0.35, alien.radius * 0.4, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.fillStyle = "rgba(255, 80, 200, 0.85)";
			ctx.arc(-alien.radius * 0.35, -alien.radius * 0.25, alien.radius * 0.25, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.fillStyle = "rgba(255, 80, 200, 0.85)";
			ctx.arc(alien.radius * 0.35, -alien.radius * 0.25, alien.radius * 0.25, 0, Math.PI * 2);
			ctx.fill();
			ctx.beginPath();
			ctx.strokeStyle = "rgba(200, 255, 80, 0.6)";
			ctx.lineWidth = 2;
			ctx.arc(0, 0, alien.radius * 1.25, 0, Math.PI * 2);
			ctx.stroke();
		}
		ctx.restore();
	}

	const currentTarget = getStageTarget(currentStage);
	const stageProgress = Math.min(1, currentStage / 18);
	const t = Math.min(1, stageProgress * 0.8 + (score / currentTarget) * 0.2);
	const startColor = { r: 255, g: 255, b: 255 };
	const endColor = { r: 255, g: 80, b: 80 };
	const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
	const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
	const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);

	if (lipsReady) {
		const size = playerIconSize;
		ctx.save();
		ctx.globalCompositeOperation = "source-over";
		ctx.shadowColor = "rgba(255, 200, 220, 0.9)";
		ctx.shadowBlur = 16;
		ctx.drawImage(lipsImage, player.x - size / 2, player.y - size / 2, size, size);
		ctx.restore();
	} else {
		ctx.beginPath();
		ctx.fillStyle = `rgb(${Math.round(r * 0.85)}, ${Math.round(g * 0.85)}, ${Math.round(b * 0.85)})`;
		ctx.shadowColor = "rgba(255, 210, 120, 0.5)";
		ctx.shadowBlur = 16;
		ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
		ctx.fill();
	}

	drawExplosions();

	ctx.restore();

	if (isGameOver) {
		ctx.save();
		ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();
	}

	ctx.save();

	const header = getHeaderMetrics();
	const headerHeight = header.height;
	const headerPadding = header.padding;
	const headerGradient = ctx.createLinearGradient(0, 0, viewportWidth, headerHeight);
	headerGradient.addColorStop(0, "rgba(8, 16, 35, 0.88)");
	headerGradient.addColorStop(0.55, "rgba(18, 20, 52, 0.84)");
	headerGradient.addColorStop(1, "rgba(8, 28, 46, 0.86)");
	ctx.fillStyle = headerGradient;
	ctx.fillRect(0, 0, viewportWidth, headerHeight);
	const topGlow = ctx.createLinearGradient(0, 0, viewportWidth, 0);
	topGlow.addColorStop(0, "rgba(88, 170, 255, 0.0)");
	topGlow.addColorStop(0.3, "rgba(88, 170, 255, 0.7)");
	topGlow.addColorStop(0.65, "rgba(120, 255, 220, 0.65)");
	topGlow.addColorStop(1, "rgba(120, 255, 220, 0.0)");
	ctx.fillStyle = topGlow;
	ctx.fillRect(0, 0, viewportWidth, 2);

	const scoreBoxWidth = Math.max(160, viewportWidth * Math.min(0.4, 0.32 + 0.08 * header.scale));
	const scoreBoxHeight = clamp(36 * header.scale, 30, 40);
	const scoreBoxX = headerPadding;
	const scoreBoxY = header.topInset + Math.max(8, 12 * header.scale);
	const scoreCardGradient = ctx.createLinearGradient(scoreBoxX, scoreBoxY, scoreBoxX + scoreBoxWidth, scoreBoxY + scoreBoxHeight);
	scoreCardGradient.addColorStop(0, "rgba(22, 32, 64, 0.92)");
	scoreCardGradient.addColorStop(1, "rgba(20, 24, 44, 0.9)");
	ctx.fillStyle = scoreCardGradient;
	ctx.beginPath();
	ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 8);
	ctx.fill();
	ctx.strokeStyle = "rgba(110, 170, 255, 0.5)";
	ctx.lineWidth = 1.2;
	ctx.stroke();

	const target = currentTarget;
	const progress = Math.min(1, score / target);
	const progressBarWidth = scoreBoxWidth - 8;
	const progressBarHeight = 6;
	const progressBarX = scoreBoxX + 4;
	const progressBarY = scoreBoxY + scoreBoxHeight - 10;

	ctx.fillStyle = "rgba(70, 84, 120, 0.6)";
	ctx.beginPath();
	ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 3);
	ctx.fill();

	const progressGradient = ctx.createLinearGradient(
		progressBarX,
		progressBarY,
		progressBarX + progressBarWidth * progress,
		progressBarY
	);
	progressGradient.addColorStop(0, "rgba(72, 188, 255, 0.98)");
	progressGradient.addColorStop(0.6, "rgba(86, 220, 255, 0.98)");
	progressGradient.addColorStop(1, "rgba(130, 255, 218, 0.95)");
	ctx.fillStyle = progressGradient;
	ctx.beginPath();
	ctx.roundRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 3);
	ctx.fill();
	ctx.shadowColor = "rgba(100, 230, 255, 0.6)";
	ctx.shadowBlur = 8;
	ctx.fill();
	ctx.shadowBlur = 0;

	ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
	ctx.textAlign = "left";
	ctx.font = `${Math.round(clamp(14 * header.scale, 12, 16))}px 'Helvetica Neue', Arial, sans-serif`;
	ctx.fillText(`Level ${currentStage + 1}  •  Skor ${score}/${target}`, scoreBoxX + 12, scoreBoxY + scoreBoxHeight * 0.5);

	const homeButton = getHomeButtonRect(shieldCount > 0);
	const usernameBoxWidth = Math.min(220, viewportWidth * 0.28);
	const usernameBoxX = scoreBoxX + scoreBoxWidth + Math.max(8, 10 * header.scale);
	const usernameBoxY = scoreBoxY;
	if (usernameBoxX + usernameBoxWidth < homeButton.x - 8) {
		const userCardGradient = ctx.createLinearGradient(usernameBoxX, usernameBoxY, usernameBoxX + usernameBoxWidth, usernameBoxY + scoreBoxHeight);
		userCardGradient.addColorStop(0, "rgba(24, 34, 66, 0.9)");
		userCardGradient.addColorStop(1, "rgba(18, 24, 42, 0.9)");
		ctx.fillStyle = userCardGradient;
		ctx.beginPath();
		ctx.roundRect(usernameBoxX, usernameBoxY, usernameBoxWidth, scoreBoxHeight, 8);
		ctx.fill();
		ctx.strokeStyle = "rgba(126, 206, 255, 0.45)";
		ctx.lineWidth = 1.1;
		ctx.stroke();
		ctx.textAlign = "left";
		ctx.fillStyle = "rgba(216, 242, 255, 0.95)";
		ctx.font = `${Math.round(clamp(12 * header.scale, 10, 14))}px 'Helvetica Neue', Arial, sans-serif`;
		const headerName = sanitizeName(username) || sanitizeName(tempUsername) || "Oyuncu";
		const visibleName = headerName.length > 14 ? `${headerName.slice(0, 14)}...` : headerName;
		ctx.fillText(`Oyuncu: ${visibleName}`, usernameBoxX + 10, usernameBoxY + scoreBoxHeight * 0.62);
	}

	const pauseGradient = ctx.createLinearGradient(homeButton.x, homeButton.y, homeButton.x, homeButton.y + homeButton.height);
	pauseGradient.addColorStop(0, "rgba(255, 172, 90, 0.96)");
	pauseGradient.addColorStop(1, "rgba(236, 115, 84, 0.94)");
	ctx.fillStyle = pauseGradient;
	ctx.beginPath();
	ctx.roundRect(homeButton.x, homeButton.y, homeButton.width, homeButton.height, 6);
	ctx.fill();
	ctx.strokeStyle = "rgba(255, 225, 180, 0.7)";
	ctx.lineWidth = 1.2;
	ctx.stroke();

	ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
	ctx.textAlign = "center";
	ctx.font = `${Math.round(clamp(12 * header.scale, 11, 14))}px 'Helvetica Neue', Arial, sans-serif`;
	ctx.fillText("Duraklat", homeButton.x + homeButton.width / 2, homeButton.y + homeButton.height * 0.62);

	if (shieldCount > 0) {
		const shieldBoxWidth = clamp(80 * header.scale, 66, 92);
		const shieldBoxHeight = clamp(32 * header.scale, 28, 38);
		const shieldBoxX = viewportWidth - shieldBoxWidth - headerPadding;
		const shieldBoxY = header.topInset + Math.max(8, 14 * header.scale);
		const shieldGradient = ctx.createLinearGradient(shieldBoxX, shieldBoxY, shieldBoxX, shieldBoxY + shieldBoxHeight);
		shieldGradient.addColorStop(0, "rgba(48, 112, 100, 0.94)");
		shieldGradient.addColorStop(1, "rgba(30, 78, 68, 0.92)");
		ctx.fillStyle = shieldGradient;
		ctx.beginPath();
		ctx.roundRect(shieldBoxX, shieldBoxY, shieldBoxWidth, shieldBoxHeight, 6);
		ctx.fill();
		ctx.strokeStyle = "rgba(145, 255, 224, 0.75)";
		ctx.lineWidth = 1.2;
		ctx.stroke();

		ctx.fillStyle = "rgba(222, 255, 247, 0.98)";
		ctx.textAlign = "center";
		ctx.font = `${Math.round(clamp(13 * header.scale, 11, 15))}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText(`🛡 ${shieldCount}`, shieldBoxX + shieldBoxWidth / 2, shieldBoxY + shieldBoxHeight * 0.65);
	}

	ctx.restore();

	if (isStageComplete) {
		const elapsed = Date.now() - stageCompleteStart;
		const alpha = Math.min(1, elapsed / 700);
		ctx.save();
		ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(320, viewportWidth - 40);
		const popupHeight = 200;
		const popupX = viewportWidth / 2 - popupWidth / 2;
		const popupY = viewportHeight / 2 - popupHeight / 2;

		ctx.shadowColor = `rgba(0, 0, 0, ${0.5 * alpha})`;
		ctx.shadowBlur = 30 * alpha;
		ctx.shadowOffsetY = 10 * alpha;
		ctx.fillStyle = `rgba(20, 25, 35, ${0.95 * alpha})`;
		ctx.beginPath();
		ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 12);
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;

		ctx.textAlign = "center";
		ctx.fillStyle = `rgba(120, 255, 180, ${alpha})`;
		ctx.font = "26px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("🎯 Level Tamamlandı!", viewportWidth / 2, popupY + 65);

		ctx.fillStyle = `rgba(200, 200, 200, ${0.7 * alpha})`;
		ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
		const nextTarget = getStageTarget(currentStage + 1);
		ctx.fillText(`Sonraki: Level ${currentStage + 2} • Hedef ${nextTarget}`, viewportWidth / 2, popupY + 95);

		const btnWidth = 180;
		const btnHeight = 40;
		const btnX = viewportWidth / 2 - btnWidth / 2;
		const btnY = popupY + popupHeight - 60;

		const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
		gradient.addColorStop(0, `rgba(100, 200, 120, ${0.9 * alpha})`);
		gradient.addColorStop(1, `rgba(60, 150, 90, ${0.9 * alpha})`);
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
		ctx.fill();

		ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Devam Et", viewportWidth / 2, btnY + 26);
		ctx.restore();
	}

	if (isGameOver) {
		const elapsed = Date.now() - gameOverStart;
		const alpha = Math.min(1, elapsed / 900);
		ctx.save();
		ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(320, viewportWidth - 40);
		const popupHeight = 280; // Increased height for more buttons
		const popupX = viewportWidth / 2 - popupWidth / 2;
		const popupY = viewportHeight / 2 - popupHeight / 2;

		ctx.shadowColor = `rgba(0, 0, 0, ${0.5 * alpha})`;
		ctx.shadowBlur = 30 * alpha;
		ctx.shadowOffsetY = 10 * alpha;
		ctx.fillStyle = `rgba(20, 25, 35, ${0.95 * alpha})`;
		ctx.beginPath();
		ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 12);
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;

		ctx.textAlign = "center";
		ctx.fillStyle = `rgba(255, 80, 80, ${alpha})`;
		ctx.font = "24px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Işığın Söndü", viewportWidth / 2, popupY + 45);

		ctx.fillStyle = `rgba(200, 200, 200, ${0.7 * alpha})`;
		ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText(`Son Skor: ${score}`, viewportWidth / 2, popupY + 70);

		const btnWidth = 200;
		const btnHeight = 40;
		const btnGap = 16;
		const startBtnY = popupY + 100;

		// 1. Restart Button
		const restartBtnY = startBtnY;
		const gradient = ctx.createLinearGradient(
			viewportWidth / 2,
			restartBtnY,
			viewportWidth / 2,
			restartBtnY + btnHeight
		);
		gradient.addColorStop(0, `rgba(80, 150, 255, ${0.9 * alpha})`);
		gradient.addColorStop(1, `rgba(50, 100, 200, ${0.9 * alpha})`);
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(
			viewportWidth / 2 - btnWidth / 2,
			restartBtnY,
			btnWidth,
			btnHeight,
			8
		);
		ctx.fill();

		ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText(
			"Yeniden Başla",
			viewportWidth / 2,
			restartBtnY + btnHeight * 0.65
		);

		// 2. Scoreboard Button
		const scoreBtnY = startBtnY + btnHeight + btnGap;
		ctx.strokeStyle = `rgba(80, 150, 255, ${0.8 * alpha})`;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.roundRect(
			viewportWidth / 2 - btnWidth / 2,
			scoreBtnY,
			btnWidth,
			btnHeight,
			8
		);
		ctx.stroke();

		ctx.fillStyle = `rgba(200, 220, 255, ${alpha})`;
		ctx.fillText(
			"Skor Tablosu",
			viewportWidth / 2,
			scoreBtnY + btnHeight * 0.65
		);

		// 3. Main Menu Button
		const menuBtnY = scoreBtnY + btnHeight + btnGap;
		ctx.strokeStyle = `rgba(150, 160, 180, ${0.6 * alpha})`;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.roundRect(
			viewportWidth / 2 - btnWidth / 2,
			menuBtnY,
			btnWidth,
			btnHeight,
			8
		);
		ctx.stroke();

		ctx.fillStyle = `rgba(180, 190, 200, ${alpha})`;
		ctx.fillText(
			"Ana Sayfa",
			viewportWidth / 2,
			menuBtnY + btnHeight * 0.65
		);

		ctx.restore();
	}

	if (showConfirmHome) {
		const { popup, continueGame, home, restart, scoreboard } = getConfirmHomeButtons();
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();

		ctx.save();
		ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
		ctx.shadowBlur = 25;
		ctx.shadowOffsetY = 8;
		ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
		ctx.beginPath();
		ctx.roundRect(popup.x, popup.y, popup.width, popup.height, 12);
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;
		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
		ctx.font = "20px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("⏸ Oyun Duraklatıldı", viewportWidth / 2, popup.y + 52);

		const continueGradient = ctx.createLinearGradient(continueGame.x, continueGame.y, continueGame.x, continueGame.y + continueGame.height);
		continueGradient.addColorStop(0, "rgba(85, 200, 132, 0.97)");
		continueGradient.addColorStop(1, "rgba(56, 154, 97, 0.95)");
		ctx.fillStyle = continueGradient;
		ctx.beginPath();
		ctx.roundRect(continueGame.x, continueGame.y, continueGame.width, continueGame.height, 8);
		ctx.fill();
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Devam Et", continueGame.x + continueGame.width / 2, continueGame.y + continueGame.height * 0.64);

		const homeGradient = ctx.createLinearGradient(home.x, home.y, home.x, home.y + home.height);
		homeGradient.addColorStop(0, "rgba(80, 150, 255, 0.95)");
		homeGradient.addColorStop(1, "rgba(50, 100, 200, 0.95)");
		ctx.fillStyle = homeGradient;
		ctx.beginPath();
		ctx.roundRect(home.x, home.y, home.width, home.height, 8);
		ctx.fill();
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Ana Sayfaya Dön", home.x + home.width / 2, home.y + home.height * 0.64);

		const restartGradient = ctx.createLinearGradient(restart.x, restart.y, restart.x, restart.y + restart.height);
		restartGradient.addColorStop(0, "rgba(255, 216, 104, 0.97)");
		restartGradient.addColorStop(1, "rgba(235, 176, 52, 0.95)");
		ctx.fillStyle = restartGradient;
		ctx.beginPath();
		ctx.roundRect(restart.x, restart.y, restart.width, restart.height, 8);
		ctx.fill();
		ctx.fillStyle = "rgba(42, 33, 8, 0.96)";
		ctx.fillText("Yeniden Başla", restart.x + restart.width / 2, restart.y + restart.height * 0.64);

		ctx.strokeStyle = "rgba(120, 200, 255, 0.8)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(scoreboard.x, scoreboard.y, scoreboard.width, scoreboard.height, 8);
		ctx.stroke();
		ctx.fillStyle = "rgba(200, 220, 255, 1)";
		ctx.fillText("Skor Tablosu", scoreboard.x + scoreboard.width / 2, scoreboard.y + scoreboard.height * 0.64);
		ctx.restore();
	}

	if (!isGameStarted) {
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(340, viewportWidth - 40);
		const popupHeight = 220;
		const popupX = viewportWidth / 2 - popupWidth / 2;
		const popupY = viewportHeight / 2 - popupHeight / 2;

		ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
		ctx.shadowBlur = 40;
		ctx.shadowOffsetY = 15;
		ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
		ctx.beginPath();
		ctx.roundRect(popupX, popupY, popupWidth, popupHeight, 12);
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
		ctx.font = "28px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("✨ Space Travel", viewportWidth / 2, popupY + 60);

		ctx.fillStyle = "rgba(200, 200, 200, 0.8)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Başlangıç: Level 1", viewportWidth / 2, popupY + 100);

		ctx.fillStyle = "rgba(180, 180, 180, 0.6)";
		ctx.font = "12px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Yıldız tozlarını topla, gök taşlarından kaç", viewportWidth / 2, popupY + 120);

		const btnWidth = 200;
		const btnHeight = 44;
		const btnX = viewportWidth / 2 - btnWidth / 2;
		const btnY = popupY + popupHeight - 65;

		const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
		gradient.addColorStop(0, "rgba(80, 150, 255, 0.95)");
		gradient.addColorStop(1, "rgba(50, 100, 200, 0.95)");
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 10);
		ctx.fill();

		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = "16px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Başla", viewportWidth / 2, btnY + 28);
		ctx.restore();
	}

	if (showLandingPage) {
		ctx.save();
		const overlay = ctx.createLinearGradient(0, 0, 0, viewportHeight);
		overlay.addColorStop(0, "rgba(0, 0, 0, 0.25)");
		overlay.addColorStop(0.5, "rgba(0, 0, 0, 0.35)");
		overlay.addColorStop(1, "rgba(0, 0, 0, 0.55)");
		ctx.fillStyle = overlay;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.globalCompositeOperation = "lighter";
		const glow1 = ctx.createRadialGradient(
			viewportWidth * 0.2,
			viewportHeight * 0.2,
			0,
			viewportWidth * 0.2,
			viewportHeight * 0.2,
			Math.max(viewportWidth, viewportHeight) * 0.35
		);
		glow1.addColorStop(0, "rgba(255, 220, 140, 0.35)");
		glow1.addColorStop(1, "rgba(255, 220, 140, 0)");
		ctx.fillStyle = glow1;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);

		const glow2 = ctx.createRadialGradient(
			viewportWidth * 0.85,
			viewportHeight * 0.25,
			0,
			viewportWidth * 0.85,
			viewportHeight * 0.25,
			Math.max(viewportWidth, viewportHeight) * 0.3
		);
		glow2.addColorStop(0, "rgba(140, 200, 255, 0.28)");
		glow2.addColorStop(1, "rgba(140, 200, 255, 0)");
		ctx.fillStyle = glow2;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);

		const glow3 = ctx.createRadialGradient(
			viewportWidth * 0.5,
			viewportHeight * 0.8,
			0,
			viewportWidth * 0.5,
			viewportHeight * 0.8,
			Math.max(viewportWidth, viewportHeight) * 0.25
		);
		glow3.addColorStop(0, "rgba(255, 160, 220, 0.22)");
		glow3.addColorStop(1, "rgba(255, 160, 220, 0)");
		ctx.fillStyle = glow3;
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();

		ctx.save();
		const layout = getLandingLayout();
		const { popup, input, playButton, scoreButton } = layout;
		const canStartFromLanding = hasValidTempUsername();
		const hasExistingName = Boolean(sanitizeName(tempUsername));
		const titleSize = Math.round(clamp(32 * popup.scale, 24, 34));
		const subtitleSize = Math.round(clamp(13 * popup.scale, 12, 14));
		const labelSize = Math.round(clamp(12 * popup.scale, 11, 13));
		const inputFontSize = Math.round(clamp(15 * popup.scale, 14, 16));
		const buttonFontSize = Math.round(clamp(14 * popup.scale, 12, 15));

		ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
		ctx.shadowBlur = 40;
		ctx.shadowOffsetY = 15;
		ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
		ctx.beginPath();
		ctx.roundRect(popup.x, popup.y, popup.width, popup.height, 12);
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
		ctx.font = `${titleSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("✨ Space Travel", viewportWidth / 2, popup.y + Math.max(48, 60 * popup.scale));

		ctx.fillStyle = "rgba(200, 200, 200, 0.7)";
		ctx.font = `${subtitleSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("Uzayda parıldayan bir yolculuğa hazır mısın?", viewportWidth / 2, popup.y + Math.max(80, 95 * popup.scale));

		ctx.textAlign = "left";
		ctx.fillStyle = "rgba(180, 180, 180, 0.8)";
		ctx.font = `${labelSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("Kullanıcı Adı:", input.x, input.y - Math.max(8, 10 * popup.scale));

		ctx.fillStyle = hasExistingName ? "rgba(35, 42, 58, 0.95)" : "rgba(40, 45, 60, 0.82)";
		ctx.beginPath();
		ctx.roundRect(input.x, input.y, input.width, input.height, 8);
		ctx.fill();

		ctx.strokeStyle = hasExistingName ? "rgba(122, 208, 255, 0.95)" : "rgba(80, 150, 255, 0.5)";
		ctx.lineWidth = 2;
		ctx.stroke();

		const shouldShowCanvasInputText = !isTypingName;
		const displayName = shouldShowCanvasInputText ? tempUsername : "";
		const placeholderText = shouldShowCanvasInputText ? "Adını gir..." : "";

		ctx.textAlign = "left";
		ctx.fillStyle = displayName
			? (hasExistingName ? "rgba(240, 246, 255, 0.98)" : "rgba(255, 255, 255, 0.9)")
			: "rgba(160, 172, 196, 0.75)";
		ctx.font = `${inputFontSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText(displayName || placeholderText, input.x + 12, input.y + input.height * 0.65);

		if (hasExistingName && !isTypingName) {
			ctx.textAlign = "right";
			ctx.fillStyle = "rgba(170, 220, 255, 0.9)";
			ctx.font = `${Math.round(clamp(11 * popup.scale, 10, 12))}px 'Helvetica Neue', Arial, sans-serif`;
			ctx.fillText("Düzenlemek için dokun", input.x + input.width - 10, input.y + input.height * 0.65);
		}

		if (landingWarning) {
			ctx.textAlign = "left";
			ctx.fillStyle = "rgba(255, 120, 120, 0.95)";
			ctx.font = `${Math.round(clamp(12 * popup.scale, 11, 13))}px 'Helvetica Neue', Arial, sans-serif`;
			ctx.fillText(landingWarning, input.x, input.y + input.height + Math.max(16, 18 * popup.scale));
		}

		if (canStartFromLanding) {
			const gradient1 = ctx.createLinearGradient(playButton.x, playButton.y, playButton.x, playButton.y + playButton.height);
			gradient1.addColorStop(0, "rgba(80, 150, 255, 0.95)");
			gradient1.addColorStop(1, "rgba(50, 100, 200, 0.95)");
			ctx.fillStyle = gradient1;
		} else {
			ctx.fillStyle = "rgba(50, 60, 80, 0.45)";
		}
		ctx.beginPath();
		ctx.roundRect(playButton.x, playButton.y, playButton.width, playButton.height, 8);
		ctx.fill();

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = `${buttonFontSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("Oyuna Başla", playButton.x + playButton.width / 2, playButton.y + playButton.height * 0.64);

		ctx.strokeStyle = "rgba(80, 150, 255, 0.8)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(scoreButton.x, scoreButton.y, scoreButton.width, scoreButton.height, 8);
		ctx.stroke();

		ctx.fillStyle = "rgba(150, 180, 255, 1)";
		ctx.font = `${buttonFontSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("Skor Tablosu", scoreButton.x + scoreButton.width / 2, scoreButton.y + scoreButton.height * 0.64);

		ctx.restore();
	}

	if (showScoreboard) {
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
		ctx.fillRect(0, 0, viewportWidth, viewportHeight);
		ctx.restore();

		ctx.save();
		const layout = getScoreboardLayout();
		const { popup, button } = layout;
		const titleSize = Math.round(clamp(26 * popup.scale, 22, 28));
		const rankSize = Math.round(clamp(18 * popup.scale, 15, 19));
		const rowTextSize = Math.round(clamp(15 * popup.scale, 13, 16));
		const buttonTextSize = Math.round(clamp(14 * popup.scale, 12, 15));

		ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
		ctx.shadowBlur = 40;
		ctx.shadowOffsetY = 15;
		ctx.fillStyle = "rgba(20, 25, 35, 0.95)";
		ctx.beginPath();
		ctx.roundRect(popup.x, popup.y, popup.width, popup.height, 12);
		ctx.fill();

		ctx.shadowColor = "transparent";
		ctx.shadowBlur = 0;
		ctx.shadowOffsetY = 0;

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 200, 100, 0.95)";
		ctx.font = `${titleSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("🏆 En İyi Skorlar", viewportWidth / 2, popup.y + Math.max(40, 50 * popup.scale));

		loadHighScores();
		const startY = popup.y + Math.max(78, 90 * popup.scale);
		const rowHeight = Math.max(36, 40 * popup.scale);
		const rowStep = Math.max(42, 50 * popup.scale);
		for (let i = 0; i < Math.min(5, highScores.length); i++) {
			const scoreData = highScores[i];
			const itemY = startY + i * rowStep;

			ctx.fillStyle = "rgba(40, 45, 60, 0.6)";
			ctx.beginPath();
			ctx.roundRect(popup.x + 20, itemY, popup.width - 40, rowHeight, 6);
			ctx.fill();

			ctx.textAlign = "left";
			ctx.fillStyle = "rgba(255, 200, 100, 0.9)";
			ctx.font = `${rankSize}px 'Helvetica Neue', Arial, sans-serif`;
			ctx.fillText(`${i + 1}.`, popup.x + 35, itemY + rowHeight * 0.65);

			ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
			ctx.font = `${rowTextSize}px 'Helvetica Neue', Arial, sans-serif`;
			ctx.fillText(scoreData.name, popup.x + 60, itemY + rowHeight * 0.65);

			ctx.textAlign = "right";
			ctx.fillStyle = "rgba(150, 200, 255, 0.9)";
			ctx.fillText(`Lv ${scoreData.level} • ${scoreData.score}`, popup.x + popup.width - 35, itemY + rowHeight * 0.65);
		}

		const gradient = ctx.createLinearGradient(button.x, button.y, button.x, button.y + button.height);
		gradient.addColorStop(0, "rgba(80, 150, 255, 0.95)");
		gradient.addColorStop(1, "rgba(50, 100, 200, 0.95)");
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(button.x, button.y, button.width, button.height, 8);
		ctx.fill();

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = `${buttonTextSize}px 'Helvetica Neue', Arial, sans-serif`;
		ctx.fillText("Geri Dön", viewportWidth / 2, button.y + button.height * 0.64);

		ctx.restore();
	}
};

const loop = () => {
	update();
	draw();
	requestAnimationFrame(loop);
};

const initAudio = () => {
	if (audioReady) {
		return;
	}
	const AudioContextClass = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextClass) {
		return;
	}
	audioContext = new AudioContextClass();
	const unlock = audioContext.state === "suspended" ? audioContext.resume() : Promise.resolve();
	unlock.then(() => {
		audioReady = true;
		startAmbience();
	});
};

const createEnvelope = (gainNode, startTime, peak, attack, decay) => {
	gainNode.gain.setValueAtTime(0.0001, startTime);
	gainNode.gain.exponentialRampToValueAtTime(peak, startTime + attack);
	gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + attack + decay);
};

const playTing = () => {
	if (!audioReady) {
		return;
	}
	const now = audioContext.currentTime;
	const osc = audioContext.createOscillator();
	const gain = audioContext.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(880, now);
	osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
	createEnvelope(gain, now, 0.06, 0.01, 0.15);
	osc.connect(gain).connect(audioContext.destination);
	osc.start(now);
	osc.stop(now + 0.2);
};

const playWoosh = () => {
	if (!audioReady) {
		return;
	}
	const now = audioContext.currentTime;
	const osc = audioContext.createOscillator();
	const gain = audioContext.createGain();
	osc.type = "triangle";
	osc.frequency.setValueAtTime(180, now);
	osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);
	createEnvelope(gain, now, 0.05, 0.01, 0.2);
	osc.connect(gain).connect(audioContext.destination);
	osc.start(now);
	osc.stop(now + 0.25);
};

const playGameOver = () => {
	if (!audioReady) {
		return;
	}
	const now = audioContext.currentTime;
	const osc = audioContext.createOscillator();
	const gain = audioContext.createGain();
	osc.type = "sawtooth";
	osc.frequency.setValueAtTime(140, now);
	osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);
	createEnvelope(gain, now, 0.08, 0.02, 0.7);
	osc.connect(gain).connect(audioContext.destination);
	osc.start(now);
	osc.stop(now + 0.8);
};

const startAmbience = () => {
	if (!audioReady || ambienceGain) {
		return;
	}
	const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
	const data = noiseBuffer.getChannelData(0);
	for (let i = 0; i < data.length; i += 1) {
		data[i] = (Math.random() * 2 - 1) * 0.2;
	}
	const noiseSource = audioContext.createBufferSource();
	noiseSource.buffer = noiseBuffer;
	noiseSource.loop = true;

	const filter = audioContext.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.setValueAtTime(160, audioContext.currentTime);

	ambienceGain = audioContext.createGain();
	ambienceGain.gain.setValueAtTime(0.015, audioContext.currentTime);

	noiseSource.connect(filter).connect(ambienceGain).connect(audioContext.destination);
	noiseSource.start();
};

const resetGame = () => {
	if (username) {
		const reachedLevel = Math.max(1, currentStage + 1);
		void syncPlayerProfile({ name: username, score, level: reachedLevel });
	}
	player.radius = 10;
	player.velocity = 0;
	player.x = viewportWidth * 0.3;
	player.y = viewportHeight * 0.5;
	trail.length = 0;
	particles.length = 0;
	planets.length = 0;
	asteroids.length = 0;
	ufos.length = 0;
	aliens.length = 0;
	explosions.length = 0;
	score = 0;
	lastCollectTime = Date.now();
	isGameOver = false;
	gameOverStart = 0;
	shieldCount = 0;
	currentStage = 0;
	isStageComplete = false;
	stageCompleteStart = 0;
	isGameStarted = false;
	showConfirmHome = false;
	shakeTime = 0;
	shakeIntensity = 0;
	shakePhase = 0;
	shakeOffsetX = 0;
	shakeOffsetY = 0;
};

const startGame = () => {
	const cleanName = sanitizeName(username);
	if (!cleanName) {
		showLandingPage = true;
		landingWarning = "Oyuna başlamak için kullanıcı adı gerekli.";
		return false;
	}
	username = cleanName;
	tempUsername = cleanName;
	landingWarning = "";
	void syncPlayerProfile({ name: username, score, level: Math.max(1, currentStage + 1) });
	isGameStarted = true;
	return true;
};

const checkStageComplete = () => {
	const target = getStageTarget(currentStage);
	if (score >= target && !isStageComplete) {
		isStageComplete = true;
		stageCompleteStart = Date.now();
	}
};

const advanceStage = () => {
	if (!isStageComplete) {
		return;
	}
	currentStage += 1;
	if (username) {
		void syncPlayerProfile({ name: username, score, level: currentStage + 1 });
	}
	score = 0;
	isStageComplete = false;
	stageCompleteStart = 0;
};

const handleRestartPress = (event) => {
	if (!isGameOver) {
		return;
	}
	event.preventDefault();
	initAudio();

	const clientX = getPointerX(event);
	const clientY = getPointerY(event);
	const { x, y } = getCanvasCoords(clientX, clientY);

	// Re-calculate button positions (must match draw logic)
	const popupHeight = 280;
	const popupY = viewportHeight / 2 - popupHeight / 2;
	const btnWidth = 200;
	const btnHeight = 40;
	const btnGap = 16;
	const startBtnY = popupY + 100;
	const btnX = viewportWidth / 2 - btnWidth / 2;

	// 1. Restart Button
	if (
		x >= btnX &&
		x <= btnX + btnWidth &&
		y >= startBtnY &&
		y <= startBtnY + btnHeight
	) {
		resetGame();
		return;
	}

	// 2. Scoreboard Button
	const scoreBtnY = startBtnY + btnHeight + btnGap;
	if (
		x >= btnX &&
		x <= btnX + btnWidth &&
		y >= scoreBtnY &&
		y <= scoreBtnY + btnHeight
	) {
		isGameOver = false;
		showScoreboard = true;
		void loadHighScores(true);
		return;
	}

	// 3. Main Menu Button
	const menuBtnY = scoreBtnY + btnHeight + btnGap;
	if (
		x >= btnX &&
		x <= btnX + btnWidth &&
		y >= menuBtnY &&
		y <= menuBtnY + btnHeight
	) {
		// Reset game state but show landing page
		resetGame();
		showLandingPage = true;
		isGameStarted = false;
		return;
	}
};

canvas.addEventListener("mousedown", handleRestartPress);
canvas.addEventListener("touchstart", handleRestartPress, { passive: false });

resizeCanvas();
void initFirebase();
loop();
