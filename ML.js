// Score variable
let score = 0;

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

// Q-Learning parameters
const LEARNING_RATE = 0.1;
const DISCOUNT_FACTOR = 0.95;
const EPSILON = 0.1;

// Q-table initialization
let qTable = {};

// Initialize Q-table for a state
function initializeQTable(state) {
    if (!qTable[state]) {
        qTable[state] = {
            'up': 0,
            'down': 0,
            'left': 0,
            'right': 0
        };
    }
}

// Get current state
function getState() {
    // Discretize the state space
    const gridSize = 20;
    const playerGridX = Math.floor(player.x / gridSize);
    const playerGridY = Math.floor(player.y / gridSize);
    const targetGridX = Math.floor(target.x / gridSize);
    const targetGridY = Math.floor(target.y / gridSize);
    
    return `${playerGridX},${playerGridY},${targetGridX},${targetGridY}`;
}

// Choose action using epsilon-greedy policy
function chooseAction(state) {
    initializeQTable(state);
    
    if (Math.random() < EPSILON) {
        // Random action
        const actions = ['up', 'down', 'left', 'right'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else {
        // Best action from Q-table
        const stateActions = qTable[state];
        return Object.keys(stateActions).reduce((a, b) => 
            stateActions[a] > stateActions[b] ? a : b
        );
    }
}

// Calculate reward
function calculateReward() {
    // Reward for reaching target
    if (player.x < target.x + target.size &&
        player.x + player.size > target.x &&
        player.y < target.y + target.size &&
        player.y + player.size > target.y) {
        return 100;
    }
    // Reward for moving closer to target
    const prevDistance = Math.sqrt(
        Math.pow(target.x - player.x, 2) + 
        Math.pow(target.y - player.y, 2)
    );
    return -prevDistance / 100; // Negative reward based on distance
}

// Update Q-value
function updateQValue(state, action, reward, nextState) {
    initializeQTable(state);
    initializeQTable(nextState);
    const currentQ = qTable[state][action];
    const nextMaxQ = Math.max(...Object.values(qTable[nextState]));
    qTable[state][action] = currentQ + LEARNING_RATE * (
        reward + DISCOUNT_FACTOR * nextMaxQ - currentQ
    );
}

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

// Modify updatePlayerPosition to use Q-Learning and dynamic speed
function updatePlayerPosition() {
    const currentState = getState();
    const action = chooseAction(currentState);
    // Store previous position for reward calculation
    const prevX = player.x;
    const prevY = player.y;
    // Calculate distance to target before move
    const prevDistance = Math.sqrt(
        Math.pow(target.x - prevX, 2) + 
        Math.pow(target.y - prevY, 2)
    );
    // Apply the chosen action
    switch(action) {
        case 'up': player.y -= player.speed; break;
        case 'down': player.y += player.speed; break;
        case 'left': player.x -= player.speed; break;
        case 'right': player.x += player.speed; break;
    }
    // Calculate new distance to target
    const newDistance = Math.sqrt(
        Math.pow(target.x - player.x, 2) + 
        Math.pow(target.y - player.y, 2)
    );
    // Increase speed if moving towards target
    if (newDistance < prevDistance) {
        player.speed = Math.min(player.speed * 1.1, 15); // Increase speed up to max of 15
    } else {
        player.speed = Math.max(player.speed * 0.95, 5); // Decrease speed but not below 5
    }
    // Keep player in bounds
    player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
    player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
    // Calculate reward and update Q-value
    const nextState = getState();
    const reward = calculateReward();
    updateQValue(currentState, action, reward, nextState);
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
    // Remove random movement
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
        score++;
        alert('You reached the target!');
        resetGame();
    }
}
// Draw the current score
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
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
    drawScore();
    requestAnimationFrame(updateGame);
}

// Initialize the game
updateGame();
