const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const usernameInput = document.getElementById("usernameInput");

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
alienImage.src = "asset/alien.png";

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
let gameOverStart = 0;
const stageTargets = [10, 25, 45, 70, 100];
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

let audioContext = null;
let ambienceGain = null;
let audioReady = false;

const getViewportSize = () => {
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

const resizeCanvas = () => {
	const { width, height } = getViewportSize();
	canvas.width = width;
	canvas.height = height;
	if (player.x === 0 && player.y === 0) {
		player.x = canvas.width * 0.3;
		player.y = canvas.height * 0.5;
	}
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
	const canvasRatio = canvas.width / canvas.height;
	const imageRatio = image.width / image.height;
	let drawWidth = canvas.width;
	let drawHeight = canvas.height;
	let drawX = 0;
	let drawY = 0;
	if (imageRatio > canvasRatio) {
		drawWidth = canvas.height * imageRatio;
		drawX = (canvas.width - drawWidth) / 2;
	} else {
		drawHeight = canvas.width / imageRatio;
		drawY = (canvas.height - drawHeight) / 2;
	}
	ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

const spawnParticle = () => {
	if (particles.length >= maxParticles) {
		return;
	}
	particles.push({
		x: randomInRange(20, canvas.width - 20),
		y: randomInRange(20, canvas.height - 20),
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
		x: fromRight ? canvas.width + size : randomInRange(0, canvas.width),
		y: fromRight ? randomInRange(0, canvas.height) : -size,
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
	const y = randomInRange(canvas.height * 0.2, canvas.height * 0.8);
	ufos.push({
		x: fromLeft ? -size : canvas.width + size,
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
	const y = randomInRange(canvas.height * 0.15, canvas.height * 0.85);
	aliens.push({
		x: fromLeft ? -size : canvas.width + size,
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
		x: randomInRange(40, canvas.width - 40),
		y: randomInRange(40, canvas.height - 40),
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
		showScoreboard = false;
		return;
	}
	const clientX = getPointerX(event);
	const clientY = getPointerY(event);
	if (showConfirmHome) {
		const { x, y } = getCanvasCoords(clientX, clientY);
		const { yes, no } = getConfirmHomeButtons();
		if (
			x >= yes.x &&
			x <= yes.x + yes.width &&
			y >= yes.y &&
			y <= yes.y + yes.height
		) {
			showConfirmHome = false;
			resetGame();
			showLandingPage = true;
			showScoreboard = false;
			usernameInput.blur();
			return;
		}
		if (
			x >= no.x &&
			x <= no.x + no.width &&
			y >= no.y &&
			y <= no.y + no.height
		) {
			showConfirmHome = false;
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
	targetX = clientX;
	targetY = clientY;
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
	targetX = getPointerX(event);
	targetY = getPointerY(event);
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
	const headerPadding = 16;
	const buttonWidth = 110;
	const buttonHeight = 32;
	const buttonY = 14;
	const shieldBoxWidth = 80;
	const gap = 10;
	const rightEdge = shieldVisible
		? canvas.width - headerPadding - shieldBoxWidth - gap
		: canvas.width - headerPadding;
	const buttonX = rightEdge - buttonWidth;
	return {
		x: buttonX,
		y: buttonY,
		width: buttonWidth,
		height: buttonHeight,
	};
};

const getConfirmHomeButtons = () => {
	const popupWidth = Math.min(320, canvas.width - 40);
	const popupHeight = 200;
	const popupX = canvas.width / 2 - popupWidth / 2;
	const popupY = canvas.height / 2 - popupHeight / 2;
	const btnWidth = 120;
	const btnHeight = 40;
	const btnY = popupY + popupHeight - 65;
	const btnYesX = popupX + 20;
	const btnNoX = popupX + popupWidth - btnWidth - 20;
	return {
		popup: { x: popupX, y: popupY, width: popupWidth, height: popupHeight },
		yes: { x: btnYesX, y: btnY, width: btnWidth, height: btnHeight },
		no: { x: btnNoX, y: btnY, width: btnWidth, height: btnHeight },
	};
};

window.addEventListener("resize", resizeCanvas);
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
				username = tempUsername.trim();
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
		tempUsername = e.target.value;
	}
});

usernameInput.addEventListener("focus", () => {
	isTypingName = true;
});

usernameInput.addEventListener("blur", () => {
	isTypingName = false;
	if (showLandingPage && tempUsername.trim()) {
		username = tempUsername.trim();
	}
});

const handleLandingInteraction = (clientX, clientY) => {
	const rect = canvas.getBoundingClientRect();
	const x = clientX - rect.left;
	const y = clientY - rect.top;
	if (showLandingPage) {
		const popupWidth = Math.min(380, canvas.width - 40);
		const popupHeight = 320;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

		const inputWidth = popupWidth - 60;
		const inputHeight = 40;
		const inputX = popupX + 30;
		const inputY = popupY + 145;

		if (x >= inputX && x <= inputX + inputWidth && y >= inputY && y <= inputY + inputHeight) {
			usernameInput.style.pointerEvents = "auto";
			usernameInput.style.opacity = "1";
			usernameInput.style.left = rect.left + inputX + "px";
			usernameInput.style.top = rect.top + inputY + "px";
			usernameInput.style.width = inputWidth + "px";
			usernameInput.style.height = inputHeight + "px";
			usernameInput.value = tempUsername;
			usernameInput.focus();
			return;
		}

		const btn1Width = 150;
		const btn1Height = 42;
		const btn1X = canvas.width / 2 - btn1Width - 10;
		const btn1Y = popupY + popupHeight - 75;

		if (x >= btn1X && x <= btn1X + btn1Width && y >= btn1Y && y <= btn1Y + btn1Height) {
			if (tempUsername.trim()) {
				username = tempUsername.trim();
				showLandingPage = false;
				usernameInput.style.pointerEvents = "none";
				usernameInput.style.opacity = "0";
			}
		}

		const btn2Width = 150;
		const btn2Height = 42;
		const btn2X = canvas.width / 2 + 10;
		const btn2Y = popupY + popupHeight - 75;

		if (x >= btn2X && x <= btn2X + btn2Width && y >= btn2Y && y <= btn2Y + btn2Height) {
			showLandingPage = false;
			showScoreboard = true;
			usernameInput.style.pointerEvents = "none";
			usernameInput.style.opacity = "0";
		}
	} else if (showScoreboard) {
		const popupWidth = Math.min(380, canvas.width - 40);
		const popupHeight = 400;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

		const btnWidth = 180;
		const btnHeight = 42;
		const btnX = canvas.width / 2 - btnWidth / 2;
		const btnY = popupY + popupHeight - 60;

		if (x >= btnX && x <= btnX + btnWidth && y >= btnY && y <= btnY + btnHeight) {
			showScoreboard = false;
			showLandingPage = true;
		}
	}
};

canvas.addEventListener("click", (e) => {
	handleLandingInteraction(e.clientX, e.clientY);
});

canvas.addEventListener("touchstart", (e) => {
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
	const bottomLimit = canvas.height - player.radius;
	const leftLimit = player.radius;
	const rightLimit = canvas.width - player.radius;

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

	const isUfoStage = stageTargets[currentStage] === 70;
	if (isUfoStage && now - lastUfoSpawn > ufoSpawnInterval) {
		spawnUfo();
		lastUfoSpawn = now;
	}

	const isAlienStage = stageTargets[currentStage] > 80;
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
			shakeTime = 8;
			shakeIntensity = 6;
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
			shakeTime = 10;
			shakeIntensity = 8;
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
			asteroid.x > canvas.width + 60 ||
			asteroid.y < -60 ||
			asteroid.y > canvas.height + 60
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

		if (ufo.x < -80 || ufo.x > canvas.width + 80 || ufo.y < -80 || ufo.y > canvas.height + 80) {
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

		if (alien.x < -80 || alien.x > canvas.width + 80 || alien.y < -80 || alien.y > canvas.height + 80) {
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
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (showLandingPage && landingBgReady) {
		ctx.save();
		ctx.globalCompositeOperation = "source-over";
		ctx.filter = "saturate(1.25) contrast(1.12) brightness(1.05)";
		drawCoverImage(landingBgImage);
		ctx.filter = "none";
		const grade = ctx.createLinearGradient(0, 0, 0, canvas.height);
		grade.addColorStop(0, "rgba(20, 10, 40, 0.15)");
		grade.addColorStop(0.5, "rgba(10, 20, 40, 0.05)");
		grade.addColorStop(1, "rgba(0, 0, 0, 0.35)");
		ctx.fillStyle = grade;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "lighter";
		const neon1 = ctx.createRadialGradient(
			canvas.width * 0.15,
			canvas.height * 0.2,
			0,
			canvas.width * 0.15,
			canvas.height * 0.2,
			Math.max(canvas.width, canvas.height) * 0.35
		);
		neon1.addColorStop(0, "rgba(255, 200, 120, 0.28)");
		neon1.addColorStop(1, "rgba(255, 200, 120, 0)");
		ctx.fillStyle = neon1;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const neon2 = ctx.createRadialGradient(
			canvas.width * 0.85,
			canvas.height * 0.25,
			0,
			canvas.width * 0.85,
			canvas.height * 0.25,
			Math.max(canvas.width, canvas.height) * 0.3
		);
		neon2.addColorStop(0, "rgba(120, 200, 255, 0.25)");
		neon2.addColorStop(1, "rgba(120, 200, 255, 0)");
		ctx.fillStyle = neon2;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const neon3 = ctx.createRadialGradient(
			canvas.width * 0.5,
			canvas.height * 0.85,
			0,
			canvas.width * 0.5,
			canvas.height * 0.85,
			Math.max(canvas.width, canvas.height) * 0.28
		);
		neon3.addColorStop(0, "rgba(255, 140, 220, 0.2)");
		neon3.addColorStop(1, "rgba(255, 140, 220, 0)");
		ctx.fillStyle = neon3;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "source-over";
		const vignette = ctx.createRadialGradient(
			canvas.width / 2,
			canvas.height / 2,
			Math.min(canvas.width, canvas.height) * 0.2,
			canvas.width / 2,
			canvas.height / 2,
			Math.max(canvas.width, canvas.height) * 0.7
		);
		vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
		vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
		ctx.fillStyle = vignette;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
	}
	ctx.save();
	ctx.globalCompositeOperation = "lighter";

	if (shakeTime > 0) {
		const offsetX = (Math.random() - 0.5) * shakeIntensity;
		const offsetY = (Math.random() - 0.5) * shakeIntensity;
		ctx.translate(offsetX, offsetY);
		shakeTime -= 1;
		shakeIntensity *= 0.9;
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

	const totalStages = Math.max(1, stageTargets.length - 1);
	const stageProgress = Math.min(1, currentStage / totalStages);
	const t = Math.min(1, stageProgress * 0.9 + (score / (stageTargets[currentStage] || 1)) * 0.1);
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
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();
	}

	ctx.save();
	
	const headerHeight = 60;
	const headerPadding = 16;
	ctx.fillStyle = "rgba(10, 15, 25, 0.75)";
	ctx.fillRect(0, 0, canvas.width, headerHeight);

	const scoreBoxWidth = Math.max(180, canvas.width * 0.35);
	const scoreBoxHeight = 36;
	const scoreBoxX = headerPadding;
	const scoreBoxY = 12;
	ctx.fillStyle = "rgba(30, 35, 50, 0.85)";
	ctx.beginPath();
	ctx.roundRect(scoreBoxX, scoreBoxY, scoreBoxWidth, scoreBoxHeight, 8);
	ctx.fill();

	const target = stageTargets[currentStage] || 100;
	const progress = Math.min(1, score / target);
	const progressBarWidth = scoreBoxWidth - 8;
	const progressBarHeight = 6;
	const progressBarX = scoreBoxX + 4;
	const progressBarY = scoreBoxY + scoreBoxHeight - 10;

	ctx.fillStyle = "rgba(60, 65, 80, 0.8)";
	ctx.beginPath();
	ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 3);
	ctx.fill();

	const progressGradient = ctx.createLinearGradient(
		progressBarX, 
		progressBarY, 
		progressBarX + progressBarWidth * progress, 
		progressBarY
	);
	progressGradient.addColorStop(0, "rgba(80, 180, 255, 0.9)");
	progressGradient.addColorStop(1, "rgba(120, 200, 255, 0.9)");
	ctx.fillStyle = progressGradient;
	ctx.beginPath();
	ctx.roundRect(progressBarX, progressBarY, progressBarWidth * progress, progressBarHeight, 3);
	ctx.fill();

	ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
	ctx.textAlign = "left";
	ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
	ctx.fillText(`Işık Yılı ${score} / ${target}`, scoreBoxX + 12, scoreBoxY + 18);

	const homeButton = getHomeButtonRect(shieldCount > 0);
	ctx.fillStyle = "rgba(35, 40, 55, 0.85)";
	ctx.beginPath();
	ctx.roundRect(homeButton.x, homeButton.y, homeButton.width, homeButton.height, 6);
	ctx.fill();
	ctx.strokeStyle = "rgba(120, 200, 255, 0.5)";
	ctx.lineWidth = 1.5;
	ctx.stroke();

	ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
	ctx.textAlign = "center";
	ctx.font = "12px 'Helvetica Neue', Arial, sans-serif";
	ctx.fillText("Ana Sayfa", homeButton.x + homeButton.width / 2, homeButton.y + 20);

	if (shieldCount > 0) {
		const shieldBoxWidth = 80;
		const shieldBoxHeight = 32;
		const shieldBoxX = canvas.width - shieldBoxWidth - headerPadding;
		const shieldBoxY = 14;
		ctx.fillStyle = "rgba(30, 50, 45, 0.85)";
		ctx.beginPath();
		ctx.roundRect(shieldBoxX, shieldBoxY, shieldBoxWidth, shieldBoxHeight, 6);
		ctx.fill();
		ctx.strokeStyle = "rgba(120, 255, 220, 0.5)";
		ctx.lineWidth = 1.5;
		ctx.stroke();

		ctx.fillStyle = "rgba(120, 255, 220, 0.9)";
		ctx.textAlign = "center";
		ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText(`🛡 ${shieldCount}`, shieldBoxX + shieldBoxWidth / 2, shieldBoxY + 21);
	}

	ctx.restore();

	if (isStageComplete) {
		const elapsed = Date.now() - stageCompleteStart;
		const alpha = Math.min(1, elapsed / 700);
		ctx.save();
		ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(320, canvas.width - 40);
		const popupHeight = 200;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

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
		ctx.fillText("🎯 Hedef Tamamlandı!", canvas.width / 2, popupY + 65);

		ctx.fillStyle = `rgba(200, 200, 200, ${0.7 * alpha})`;
		ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
		const nextTarget = stageTargets[currentStage + 1];
		if (nextTarget) {
			ctx.fillText(`Sonraki hedef: ${nextTarget} Işık Yılı`, canvas.width / 2, popupY + 95);
		} else {
			ctx.fillText("Son seviyeyi tamamladın!", canvas.width / 2, popupY + 95);
		}

		const btnWidth = 180;
		const btnHeight = 40;
		const btnX = canvas.width / 2 - btnWidth / 2;
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
		ctx.fillText("Devam Et", canvas.width / 2, btnY + 26);
		ctx.restore();
	}

	if (isGameOver) {
		const elapsed = Date.now() - gameOverStart;
		const alpha = Math.min(1, elapsed / 900);
		ctx.save();
		ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(320, canvas.width - 40);
		const popupHeight = 180;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

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
		ctx.fillText("Işığın Söndü", canvas.width / 2, popupY + 60);

		ctx.fillStyle = `rgba(200, 200, 200, ${0.7 * alpha})`;
		ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText(`Son Skor: ${score}`, canvas.width / 2, popupY + 90);

		const btnWidth = 180;
		const btnHeight = 40;
		const btnX = canvas.width / 2 - btnWidth / 2;
		const btnY = popupY + popupHeight - 60;

		const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
		gradient.addColorStop(0, `rgba(80, 150, 255, ${0.9 * alpha})`);
		gradient.addColorStop(1, `rgba(50, 100, 200, ${0.9 * alpha})`);
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
		ctx.fill();

		ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Yeniden Başla", canvas.width / 2, btnY + 26);
		ctx.restore();
	}

	if (showConfirmHome) {
		const { popup, yes, no } = getConfirmHomeButtons();
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
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
		ctx.fillText("Ana sayfaya dönmek", canvas.width / 2, popup.y + 70);
		ctx.fillText("istiyor musun?", canvas.width / 2, popup.y + 95);

		ctx.fillStyle = "rgba(80, 150, 255, 0.95)";
		ctx.beginPath();
		ctx.roundRect(yes.x, yes.y, yes.width, yes.height, 8);
		ctx.fill();
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Evet", yes.x + yes.width / 2, yes.y + 26);

		ctx.strokeStyle = "rgba(120, 200, 255, 0.8)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(no.x, no.y, no.width, no.height, 8);
		ctx.stroke();
		ctx.fillStyle = "rgba(200, 220, 255, 1)";
		ctx.fillText("Vazgeç", no.x + no.width / 2, no.y + 26);
		ctx.restore();
	}

	if (!isGameStarted) {
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(340, canvas.width - 40);
		const popupHeight = 220;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

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
		ctx.fillText("✨ Space Travel", canvas.width / 2, popupY + 60);

		ctx.fillStyle = "rgba(200, 200, 200, 0.8)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText(`İlk hedef: ${stageTargets[0]} Işık Yılı`, canvas.width / 2, popupY + 100);

		ctx.fillStyle = "rgba(180, 180, 180, 0.6)";
		ctx.font = "12px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Yıldız tozlarını topla, gök taşlarından kaç", canvas.width / 2, popupY + 120);

		const btnWidth = 200;
		const btnHeight = 44;
		const btnX = canvas.width / 2 - btnWidth / 2;
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
		ctx.fillText("Başla", canvas.width / 2, btnY + 28);
		ctx.restore();
	}

	if (showLandingPage) {
		ctx.save();
		const overlay = ctx.createLinearGradient(0, 0, 0, canvas.height);
		overlay.addColorStop(0, "rgba(0, 0, 0, 0.25)");
		overlay.addColorStop(0.5, "rgba(0, 0, 0, 0.35)");
		overlay.addColorStop(1, "rgba(0, 0, 0, 0.55)");
		ctx.fillStyle = overlay;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.globalCompositeOperation = "lighter";
		const glow1 = ctx.createRadialGradient(
			canvas.width * 0.2,
			canvas.height * 0.2,
			0,
			canvas.width * 0.2,
			canvas.height * 0.2,
			Math.max(canvas.width, canvas.height) * 0.35
		);
		glow1.addColorStop(0, "rgba(255, 220, 140, 0.35)");
		glow1.addColorStop(1, "rgba(255, 220, 140, 0)");
		ctx.fillStyle = glow1;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const glow2 = ctx.createRadialGradient(
			canvas.width * 0.85,
			canvas.height * 0.25,
			0,
			canvas.width * 0.85,
			canvas.height * 0.25,
			Math.max(canvas.width, canvas.height) * 0.3
		);
		glow2.addColorStop(0, "rgba(140, 200, 255, 0.28)");
		glow2.addColorStop(1, "rgba(140, 200, 255, 0)");
		ctx.fillStyle = glow2;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const glow3 = ctx.createRadialGradient(
			canvas.width * 0.5,
			canvas.height * 0.8,
			0,
			canvas.width * 0.5,
			canvas.height * 0.8,
			Math.max(canvas.width, canvas.height) * 0.25
		);
		glow3.addColorStop(0, "rgba(255, 160, 220, 0.22)");
		glow3.addColorStop(1, "rgba(255, 160, 220, 0)");
		ctx.fillStyle = glow3;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(380, canvas.width - 40);
		const popupHeight = 320;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

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
		ctx.font = "32px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("✨ Space Travel", canvas.width / 2, popupY + 60);

		ctx.fillStyle = "rgba(200, 200, 200, 0.7)";
		ctx.font = "13px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Uzayda parıldayan bir yolculuğa hazır mısın?", canvas.width / 2, popupY + 95);

		ctx.textAlign = "left";
		ctx.fillStyle = "rgba(180, 180, 180, 0.8)";
		ctx.font = "12px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Kullanıcı Adı:", popupX + 30, popupY + 135);

		const inputWidth = popupWidth - 60;
		const inputHeight = 40;
		const inputX = popupX + 30;
		const inputY = popupY + 145;

		ctx.fillStyle = "rgba(40, 45, 60, 0.8)";
		ctx.beginPath();
		ctx.roundRect(inputX, inputY, inputWidth, inputHeight, 8);
		ctx.fill();

		ctx.strokeStyle = "rgba(80, 150, 255, 0.5)";
		ctx.lineWidth = 2;
		ctx.stroke();

		const shouldShowCanvasInputText = !isTypingName;
		const displayName = shouldShowCanvasInputText ? tempUsername : "";
		const placeholderText = shouldShowCanvasInputText ? "Adını gir..." : "";

		ctx.textAlign = "left";
		ctx.fillStyle = displayName ? "rgba(255, 255, 255, 0.9)" : "rgba(150, 150, 150, 0.5)";
		ctx.font = "15px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText(displayName || placeholderText, inputX + 15, inputY + 26);

		const btn1Width = 150;
		const btn1Height = 42;
		const btn1X = canvas.width / 2 - btn1Width - 10;
		const btn1Y = popupY + popupHeight - 75;

		const gradient1 = ctx.createLinearGradient(btn1X, btn1Y, btn1X, btn1Y + btn1Height);
		gradient1.addColorStop(0, "rgba(80, 150, 255, 0.95)");
		gradient1.addColorStop(1, "rgba(50, 100, 200, 0.95)");
		ctx.fillStyle = gradient1;
		ctx.beginPath();
		ctx.roundRect(btn1X, btn1Y, btn1Width, btn1Height, 8);
		ctx.fill();

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Oyuna Başla", btn1X + btn1Width / 2, btn1Y + 27);

		const btn2Width = 150;
		const btn2Height = 42;
		const btn2X = canvas.width / 2 + 10;
		const btn2Y = popupY + popupHeight - 75;

		ctx.strokeStyle = "rgba(80, 150, 255, 0.8)";
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.roundRect(btn2X, btn2Y, btn2Width, btn2Height, 8);
		ctx.stroke();

		ctx.fillStyle = "rgba(150, 180, 255, 1)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Skor Tablosu", btn2X + btn2Width / 2, btn2Y + 27);

		ctx.restore();
	}

	if (showScoreboard) {
		ctx.save();
		ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.restore();

		ctx.save();
		const popupWidth = Math.min(380, canvas.width - 40);
		const popupHeight = 400;
		const popupX = canvas.width / 2 - popupWidth / 2;
		const popupY = canvas.height / 2 - popupHeight / 2;

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
		ctx.fillStyle = "rgba(255, 200, 100, 0.95)";
		ctx.font = "26px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("🏆 En İyi Skorlar", canvas.width / 2, popupY + 50);

		loadHighScores();
		const startY = popupY + 90;
		for (let i = 0; i < Math.min(5, highScores.length); i++) {
			const scoreData = highScores[i];
			const itemY = startY + i * 50;
			
			ctx.fillStyle = "rgba(40, 45, 60, 0.6)";
			ctx.beginPath();
			ctx.roundRect(popupX + 20, itemY, popupWidth - 40, 40, 6);
			ctx.fill();

			ctx.textAlign = "left";
			ctx.fillStyle = "rgba(255, 200, 100, 0.9)";
			ctx.font = "18px 'Helvetica Neue', Arial, sans-serif";
			ctx.fillText(`${i + 1}.`, popupX + 35, itemY + 26);

			ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
			ctx.font = "15px 'Helvetica Neue', Arial, sans-serif";
			ctx.fillText(scoreData.name, popupX + 60, itemY + 26);

			ctx.textAlign = "right";
			ctx.fillStyle = "rgba(150, 200, 255, 0.9)";
			ctx.fillText(`${scoreData.score} LY`, popupX + popupWidth - 35, itemY + 26);
		}

		const btnWidth = 180;
		const btnHeight = 42;
		const btnX = canvas.width / 2 - btnWidth / 2;
		const btnY = popupY + popupHeight - 60;

		const gradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnHeight);
		gradient.addColorStop(0, "rgba(80, 150, 255, 0.95)");
		gradient.addColorStop(1, "rgba(50, 100, 200, 0.95)");
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 8);
		ctx.fill();

		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(255, 255, 255, 1)";
		ctx.font = "14px 'Helvetica Neue', Arial, sans-serif";
		ctx.fillText("Geri Dön", canvas.width / 2, btnY + 27);

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
	if (username && score > 0) {
		saveScore(username, score);
	}
	player.radius = 10;
	player.velocity = 0;
	player.x = canvas.width * 0.3;
	player.y = canvas.height * 0.5;
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
};

const startGame = () => {
	isGameStarted = true;
};

const loadHighScores = () => {
	try {
		const saved = localStorage.getItem('lightJourneyScores');
		highScores = saved ? JSON.parse(saved) : [];
		highScores.sort((a, b) => b.score - a.score);
	} catch (e) {
		highScores = [];
	}
};

const saveScore = (name, scoreValue) => {
	try {
		loadHighScores();
		highScores.push({ name, score: scoreValue, date: Date.now() });
		highScores.sort((a, b) => b.score - a.score);
		highScores = highScores.slice(0, 10);
		localStorage.setItem('lightJourneyScores', JSON.stringify(highScores));
	} catch (e) {
		console.error('Skor kaydedilemedi');
	}
};

const checkStageComplete = () => {
	const target = stageTargets[currentStage];
	if (target && score >= target && !isStageComplete) {
		isStageComplete = true;
		stageCompleteStart = Date.now();
	}
};

const advanceStage = () => {
	if (!isStageComplete) {
		return;
	}
	if (currentStage < stageTargets.length - 1) {
		currentStage += 1;
		score = 0;
		isStageComplete = false;
		stageCompleteStart = 0;
	} else {
		isStageComplete = false;
		stageCompleteStart = 0;
	}
};

const handleRestartPress = (event) => {
	if (!isGameOver) {
		return;
	}
	event.preventDefault();
	initAudio();
	resetGame();
};

canvas.addEventListener("mousedown", handleRestartPress);
canvas.addEventListener("touchstart", handleRestartPress, { passive: false });

resizeCanvas();
loop();
