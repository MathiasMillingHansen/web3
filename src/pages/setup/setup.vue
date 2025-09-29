<template>
    <!-- Name input modal -->
    <div v-if="showNameModal" :class="styles.modal_overlay">
        <div :class="styles.modal">
            <h2>Enter your name</h2>
            <input v-model="playerName" :class="styles.modal_input" placeholder="Your name"
                @keyup.enter="submitName" />
            <button :class="styles.modal_button" @click="submitName">OK</button>
        </div>
    </div>

    <!-- Main setup screen -->
    <div v-if="!showNameModal && !gameMode" :class="styles.setup_header">
        <h1 :class="styles.h1">UNO Game</h1>
        <div :class="styles.setup_body">
            <button :class="styles.setup_button" @click="setGameMode('create')">
                <h2 :class="styles.h2">Create Game</h2>
            </button>
            <button :class="styles.setup_button" @click="setGameMode('join')">
                <h2 :class="styles.h2">Join Game</h2>
            </button>
        </div>
    </div>

    <!-- Create game screen -->
    <div v-if="gameMode === 'create'" :class="styles.setup_header">
        <h1 :class="styles.h1">Game Created!</h1>
        <div :class="styles.setup_body">
            <div :class="styles.player_configuration">
                <!-- Game ID display for sharing -->
                <div :class="styles.game_id_section">
                    <h3 :class="styles.h3">Share with friends:</h3>
                    <div :class="styles.game_id_display">
                        <span :class="styles.game_id">{{ createdGameId }}</span>
                        <button :class="styles.copy_button" @click="copyGameId">Copy ID</button>
                    </div>
                    <p :class="styles.share_text">Friends can join using this Game ID</p>
                </div>
                
                <!-- Player configuration -->
                <div :class="styles.player_config_section">
                    <h3 :class="styles.h3">Configure Players ({{ totalPlayers }}/5)</h3>
                    <div :class="styles.player_list">
                        <div :class="styles.player_item">
                            <span>{{ playerName }} (You)</span>
                        </div>
                        <div v-for="botIndex in botCount" :key="botIndex" :class="styles.player_item">
                            <span>Bot {{ botIndex }}</span>
                            <button 
                                v-if="totalPlayers > 2" 
                                :class="styles.remove_bot_button" 
                                @click="removeBot(botIndex)"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    <div :class="styles.bot_controls">
                        <button 
                            :class="styles.add_bot_button" 
                            @click="addBot" 
                            :disabled="totalPlayers >= 5"
                        >
                            Add Bot
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div :class="styles.start_button_container">
            <button :class="styles.start_button" @click="joinCreatedGame" :disabled="creatingGame">
                <h2 :class="styles.h2">START PLAYING</h2>
            </button>
            <button :class="styles.back_button" @click="goBack">
                <h2 :class="styles.h2">Back</h2>
            </button>
            <div v-if="createGameError" style="color: red; margin-top: 10px;">
                Error: {{ createGameError.message }}
            </div>
        </div>
    </div>

    <!-- Join game screen -->
    <div v-if="gameMode === 'join'" :class="styles.setup_header">
        <h1 :class="styles.h1">Join Game</h1>
        <div :class="styles.setup_body">
            <p>Join game functionality coming soon...</p>
        </div>
        <div :class="styles.start_button_container">
            <button :class="styles.back_button" @click="goBack">
                <h2 :class="styles.h2">Back</h2>
            </button>
        </div>
    </div>
</template>

<script setup>
import styles from './setup.module.css';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@vue/apollo-composable';
import { CREATE_GAME } from '../../graphql/queries';

const router = useRouter();

// State management
const showNameModal = ref(true);
const playerName = ref('');
const gameMode = ref(''); // 'create', 'join', 'created', or ''
const botCount = ref(1); // Start with 1 bot (minimum)
const createdGameId = ref(''); // Store the created game ID

// Computed properties
const totalPlayers = computed(() => 1 + botCount.value); // 1 player + bots

// GraphQL mutation for creating a game
const { mutate: createGame, loading: creatingGame, error: createGameError } = useMutation(CREATE_GAME);

function submitName() {
    if (playerName.value.trim() !== '') {
        showNameModal.value = false;
    }
}

function setGameMode(mode) {
    if (mode === 'create') {
        // Immediately create a game when entering create mode
        createInitialGame();
    } else {
        gameMode.value = mode;
    }
}

async function createInitialGame() {
    try {
        // Create game with player and initial bot (minimum requirement)
        const playerNames = [playerName.value.trim(), 'Bot 1'];
        
        console.log('Creating initial game with players:', playerNames);
        
        const result = await createGame({
            playerNames
        });
        
        if (result?.data?.createGame?.id) {
            const gameId = result.data.createGame.id;
            console.log('Initial game created with ID:', gameId);
            
            // Store the game ID and show the create screen
            createdGameId.value = gameId;
            gameMode.value = 'create';
        }
    } catch (error) {
        console.error('Error creating initial game:', error);
        alert('Failed to create game. Please try again.');
    }
}

function goBack() {
    gameMode.value = '';
    createdGameId.value = '';
    botCount.value = 1;
}

function addBot() {
    if (totalPlayers.value < 5) {
        botCount.value++;
        // TODO: Update the game on the server with new bot
    }
}

function removeBot(botIndex) {
    if (totalPlayers.value > 2) { // Keep at least 2 total players (1 human + 1 bot minimum)
        botCount.value--;
        // TODO: Update the game on the server to remove bot
    }
}

function copyGameId() {
    navigator.clipboard.writeText(createdGameId.value).then(() => {
        alert('Game ID copied to clipboard!');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = createdGameId.value;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Game ID copied to clipboard!');
    });
}

function joinCreatedGame() {
    // Navigate to the created game
    router.push({
        path: '/game',
        query: { gameId: createdGameId.value, playerId: '0' }
    });
}

function createNewGame() {
    // Reset state to create a new game
    gameMode.value = 'create';
    createdGameId.value = '';
    botCount.value = 1;
}
</script>