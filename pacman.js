// Basic Pacman Game for Web Browser

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded. Initializing game...");

    // Get the canvas and context from the existing DOM
    const canvas = document.getElementById('pacmanCanvas');
    if (!canvas) {
        console.error("Canvas element 'pacmanCanvas' not found.");
        return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 400;

    // Define the game variables
    let pacman = { x: 200, y: 200, size: 20, dx: 0, dy: 0, invincible: false, invincibleTimer: 0 };
    let pellets = [];
    let powerPellets = [
        { x: 20, y: 20 },
        { x: canvas.width - 20, y: 20 },
        { x: 20, y: canvas.height - 20 },
        { x: canvas.width - 20, y: canvas.height - 20 }
    ];
    let ghosts = [
        { x: 100, y: 100, size: 20, dx: 2, dy: 0, color: 'red', behavior: 'chaser' },
        { x: 300, y: 300, size: 20, dx: -2, dy: 0, color: 'blue', behavior: 'ambusher' },
        { x: 200, y: 100, size: 20, dx: 2, dy: 0, color: 'pink', behavior: 'patroller', pathIndex: 0, path: [
            { x: 200, y: 100 }, { x: 200, y: 300 }, { x: 100, y: 300 }, { x: 100, y: 100 }
        ] },
        { x: 100, y: 300, size: 20, dx: 0, dy: 0, color: 'orange', behavior: 'random' }
    ];
    let score = 0;
    let gridSize = 20;
    let maze = [
        { x: 80, y: 80, width: 240, height: 20 },
        { x: 80, y: 300, width: 240, height: 20 },
        { x: 80, y: 100, width: 20, height: 200 },
        { x: 300, y: 100, width: 20, height: 200 }
    ];

    // Initialize the pellets
    function createPellets() {
        for (let i = gridSize; i < canvas.width; i += gridSize) {
            for (let j = gridSize; j < canvas.height; j += gridSize) {
                if (!maze.some(wall =>
                    i > wall.x && i < wall.x + wall.width &&
                    j > wall.y && j < wall.y + wall.height)) {
                    pellets.push({ x: i, y: j });
                }
            }
        }
    }

    // Draw the game elements
    function drawPacman() {
        ctx.beginPath();
        ctx.arc(pacman.x, pacman.y, pacman.size, 0.2 * Math.PI, 1.8 * Math.PI);
        ctx.lineTo(pacman.x, pacman.y);
        ctx.fillStyle = pacman.invincible ? 'orange' : 'yellow';
        ctx.fill();
        ctx.closePath();
    }

    function drawPellets() {
        pellets.forEach(pellet => {
            ctx.beginPath();
            ctx.arc(pellet.x, pellet.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.closePath();
        });
    }

    function drawPowerPellets() {
        powerPellets.forEach(pellet => {
            ctx.beginPath();
            ctx.arc(pellet.x, pellet.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'gold';
            ctx.fill();
            ctx.closePath();
        });
    }

    function drawGhosts() {
        ghosts.forEach(ghost => {
            ctx.beginPath();
            ctx.arc(ghost.x, ghost.y, ghost.size, 0, 2 * Math.PI);
            ctx.fillStyle = ghost.color;
            ctx.fill();
            ctx.closePath();
        });
    }

    function drawMaze() {
        ctx.fillStyle = 'blue';
        maze.forEach(wall => {
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        });
    }

    function drawScore() {
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${score}`, 10, 20);
    }

    // Update Pacman's position
    function updatePacman() {
        let nextX = pacman.x + pacman.dx;
        let nextY = pacman.y + pacman.dy;

        // Check for wall collisions
        if (!maze.some(wall =>
            nextX + pacman.size > wall.x &&
            nextX - pacman.size < wall.x + wall.width &&
            nextY + pacman.size > wall.y &&
            nextY - pacman.size < wall.y + wall.height)) {
            pacman.x = nextX;
            pacman.y = nextY;
        }

        // Wrap around the screen
        if (pacman.x > canvas.width) pacman.x = 0;
        if (pacman.x < 0) pacman.x = canvas.width;
        if (pacman.y > canvas.height) pacman.y = 0;
        if (pacman.y < 0) pacman.y = canvas.height;

        // Update invincibility timer
        if (pacman.invincible) {
            pacman.invincibleTimer--;
            if (pacman.invincibleTimer <= 0) {
                pacman.invincible = false;
            }
        }
    }

    // Update Ghosts' positions
    function updateGhosts() {
        ghosts.forEach(ghost => {
            switch (ghost.behavior) {
                case 'chaser':
                    // Move directly towards Pacman
                    let dxChaser = pacman.x - ghost.x;
                    let dyChaser = pacman.y - ghost.y;
                    let magnitudeChaser = Math.sqrt(dxChaser * dxChaser + dyChaser * dyChaser);
                    ghost.dx = (dxChaser / magnitudeChaser) * 2;
                    ghost.dy = (dyChaser / magnitudeChaser) * 2;
                    break;

                case 'ambusher':
                    // Target a position ahead of Pacman
                    let targetX = pacman.x + pacman.dx * 40;
                    let targetY = pacman.y + pacman.dy * 40;
                    let dxAmbusher = targetX - ghost.x;
                    let dyAmbusher = targetY - ghost.y;
                    let magnitudeAmbusher = Math.sqrt(dxAmbusher * dxAmbusher + dyAmbusher * dyAmbusher);
                    ghost.dx = (dxAmbusher / magnitudeAmbusher) * 2;
                    ghost.dy = (dyAmbusher / magnitudeAmbusher) * 2;
                    break;

                case 'patroller':
                    // Move along a predefined path
                    let target = ghost.path[ghost.pathIndex];
                    let dxPatroller = target.x - ghost.x;
                    let dyPatroller = target.y - ghost.y;
                    if (Math.abs(dxPatroller) < 2 && Math.abs(dyPatroller) < 2) {
                        ghost.pathIndex = (ghost.pathIndex + 1) % ghost.path.length;
                    } else {
                        let magnitudePatroller = Math.sqrt(dxPatroller * dxPatroller + dyPatroller * dyPatroller);
                        ghost.dx = (dxPatroller / magnitudePatroller) * 2;
                        ghost.dy = (dyPatroller / magnitudePatroller) * 2;
                    }
                    break;

                case 'random':
                    // Move in a random direction unless hitting a wall
                    if (Math.random() < 0.02 || maze.some(wall =>
                        ghost.x + ghost.dx + ghost.size > wall.x &&
                        ghost.x + ghost.dx - ghost.size < wall.x + wall.width &&
                        ghost.y + ghost.dy + ghost.size > wall.y &&
                        ghost.y + ghost.dy - ghost.size < wall.y + wall.height)) {
                        const directions = [
                            { dx: 2, dy: 0 },
                            { dx: -2, dy: 0 },
                            { dx: 0, dy: 2 },
                            { dx: 0, dy: -2 }
                        ];
                        const newDir = directions[Math.floor(Math.random() * directions.length)];
                        ghost.dx = newDir.dx;
                        ghost.dy = newDir.dy;
                    }
                    break;
            }

            // Update ghost position
            ghost.x += ghost.dx;
            ghost.y += ghost.dy;

            // Wrap around the screen
            if (ghost.x > canvas.width) ghost.x = 0;
            if (ghost.x < 0) ghost.x = canvas.width;
            if (ghost.y > canvas.height) ghost.y = 0;
            if (ghost.y < 0) ghost.y = canvas.height;
        });
    }

    // Collision checks
    function checkCollisions() {
        pellets = pellets.filter(pellet => {
            const distance = Math.sqrt(
                (pacman.x - pellet.x) ** 2 + (pacman.y - pellet.y) ** 2
            );
            if (distance < pacman.size) {
                score += 10;
                return false;
            }
            return true;
        });
    }

    function checkPowerPelletCollisions() {
        powerPellets = powerPellets.filter(pellet => {
            const distance = Math.sqrt(
                (pacman.x - pellet.x) ** 2 + (pacman.y - pellet.y) ** 2
            );
            if (distance < pacman.size) {
                pacman.invincible = true;
                pacman.invincibleTimer = 300; // 5 seconds at 60fps
                return false;
            }
            return true;
        });
    }

    function checkGhostCollisions() {
        ghosts.forEach(ghost => {
            const distance = Math.sqrt(
                (pacman.x - ghost.x) ** 2 + (pacman.y - ghost.y) ** 2
            );
            if (distance < pacman.size + ghost.size) {
                if (pacman.invincible) {
                    score += 100;
                    ghost.x = Math.random() * canvas.width;
                    ghost.y = Math.random() * canvas.height;
                } else {
                    // Game over
                    alert('Game Over! Your score: ' + score);
                    document.location.reload();
                }
            }
        });
    }

    // Game loop
    function gameLoop() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawMaze();
        drawPacman();
        drawPellets();
        drawPowerPellets();
        drawGhosts();
        drawScore();

        updatePacman();
        updateGhosts();
        checkCollisions();
        checkPowerPelletCollisions();
        checkGhostCollisions();

        requestAnimationFrame(gameLoop);
    }

    // Start the game
    createPellets();
    gameLoop();
});
