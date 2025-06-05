// Get the canvas element and context
const canvas = document.getElementById('modelCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Define player and target positions
let player = { 
    x: 50, 
    y: 50, 
    size: 20, 
    color: 'blue',
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    glitchFactor: 0.2
};

// Define target
let target = {
    x: 750,
    y: 550,
    size: 20,
    color: 'red'
};

// Add movement state tracking
let movement = {
    up: false,
    down: false,
    left: false,
    right: false
};

// Add glitch states
let glitchStates = {
    teleportCooldown: 0,
    reverseControls: false,
    speedMultiplier: 1
};

// Handle keydown events
document.addEventListener('keydown', (event) => {
    event.preventDefault();
    switch (event.key) {
        case 'ArrowUp': movement.up = true; break;
        case 'ArrowDown': movement.down = true; break;
        case 'ArrowLeft': movement.left = true; break;
        case 'ArrowRight': movement.right = true; break;
    }
});

// Handle keyup events
document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowUp': movement.up = false; break;
        case 'ArrowDown': movement.down = false; break;
        case 'ArrowLeft': movement.left = false; break;
        case 'ArrowRight': movement.right = false; break;
    }
});

// Update player position with bugs
function updatePlayerPosition() {
    // Random teleports
    if (Math.random() < player.glitchFactor) {
        player.x += (Math.random() - 0.5) * 100;
        player.y += (Math.random() - 0.5) * 100;
    }

    // Randomly reverse controls
    if (Math.random() < 0.01) {
        glitchStates.reverseControls = !glitchStates.reverseControls;
        player.color = glitchStates.reverseControls ? 'purple' : 'blue';
    }

    // Random speed changes
    if (Math.random() < 0.02) {
        glitchStates.speedMultiplier = Math.random() * 3 + 0.5;
    }

    // Apply movement with bugs
    let currentSpeed = player.speed * glitchStates.speedMultiplier;
    if (glitchStates.reverseControls) {
        if (movement.up) player.y += currentSpeed;
        if (movement.down) player.y -= currentSpeed;
        if (movement.left) player.x += currentSpeed;
        if (movement.right) player.x -= currentSpeed;
    } else {
        if (movement.up) player.y -= currentSpeed;
        if (movement.down) player.y += currentSpeed;
        if (movement.left) player.x -= currentSpeed;
        if (movement.right) player.x += currentSpeed;
    }

    // Sometimes ignore boundaries
    if (Math.random() > 0.8) {
        // Wrap around screen
        if (player.x < 0) player.x = canvas.width;
        if (player.x > canvas.width) player.x = 0;
        if (player.y < 0) player.y = canvas.height;
        if (player.y > canvas.height) player.y = 0;
    }
}

// Modified draw player with glitch effect
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);
    
    // Sometimes draw ghost images
    if (Math.random() < 0.1) {
        ctx.globalAlpha = 0.3;
        ctx.fillRect(
            player.x + (Math.random() - 0.5) * 20,
            player.y + (Math.random() - 0.5) * 20,
            player.size,
            player.size
        );
        ctx.globalAlpha = 1.0;
    }
}

// Modified target behavior
function drawTarget() {
    // Target occasionally moves
    if (Math.random() < 0.02) {
        target.x += (Math.random() - 0.5) * 20;
        target.y += (Math.random() - 0.5) * 20;
        
        // Keep target in bounds
        target.x = Math.max(0, Math.min(canvas.width - target.size, target.x));
        target.y = Math.max(0, Math.min(canvas.height - target.size, target.y));
    }
    
    ctx.fillStyle = target.color;
    ctx.fillRect(target.x, target.y, target.size, target.size);
}

// Clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Check if player reached target
function checkWin() {
    if (player.x < target.x + target.size &&
        player.x + player.size > target.x &&
        player.y < target.y + target.size &&
        player.y + player.size > target.y) {
        alert('You reached the target!');
        resetGame();
    }
}

// Reset the game with random target position
function resetGame() {
    player.x = 50;
    player.y = 50;
    target.x = Math.random() * (canvas.width - target.size);
    target.y = Math.random() * (canvas.height - target.size);
}

// Update the game state
function updateGame() {
    clearCanvas();
    updatePlayerPosition();
    checkWin();
    drawPlayer();
    drawTarget();
    requestAnimationFrame(updateGame);
}

// Initialize the game
updateGame();
