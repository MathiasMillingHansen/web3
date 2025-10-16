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
                    <h3 :class="styles.h3">Configure Players ({{ currentPlayerCount }}/5)</h3>
                    <div :class="styles.player_list">
                        <!-- Show real-time players if subscription is active -->
                        <div v-if="lobbyPlayers.length > 0">
                            <div v-for="(player, index) in lobbyPlayers" :key="player.id" :class="styles.player_item">
                                <span>{{ player.name }} {{ player.id === currentPlayerId ? '(You)' : '' }}</span>
                                <span>👤</span>
                            </div>
                        </div>
                        <!-- Fallback to static display -->
                        <div v-else>
                            <div :class="styles.player_item">
                                <span>{{ playerName }} (You)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div :class="styles.start_button_container">
            <button :class="styles.start_button" @click="joinCreatedGame" :disabled="startingGame || currentPlayerCount < 2">
                <h2 :class="styles.h2">{{ startingGame ? 'STARTING...' : 'START PLAYING' }}</h2>
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
            <div :class="styles.join_game_section">
                <h3 :class="styles.h3">Enter Game ID:</h3>
                <div :class="styles.join_input_container">
                    <input
                        v-model="joinGameId"
                        :class="styles.game_id_input"
                        placeholder="Enter Game ID"
                        @keyup.enter="joinExistingGame"
                    />
                    <button
                        :class="styles.join_button"
                        @click="joinExistingGame"
                        :disabled="!joinGameId.trim() || joiningGame"
                    >
                        {{ joiningGame ? 'JOINING...' : 'JOIN' }}
                    </button>
                </div>
                <div v-if="joinGameError" :class="styles.error_message">
                    {{ joinGameError }}
                </div>
            </div>
        </div>
        <div :class="styles.start_button_container">
            <button :class="styles.back_button" @click="goBack">
                <h2 :class="styles.h2">Back</h2>
            </button>
        </div>
    </div>

    <!-- Lobby screen (for joined players) -->
    <div v-if="gameMode === 'lobby'" :class="styles.setup_header">
        <h1 :class="styles.h1">Game Lobby</h1>
        <div :class="styles.setup_body">
            <div :class="styles.player_configuration">
                <!-- Game ID display for sharing -->
                <div :class="styles.game_id_section">
                    <h3 :class="styles.h3">Game ID:</h3>
                    <div :class="styles.game_id_display">
                        <span :class="styles.game_id">{{ createdGameId }}</span>
                        <button :class="styles.copy_button" @click="copyGameId">Copy ID</button>
                    </div>
                    <p :class="styles.share_text">Share this with more friends!</p>
                </div>

                <!-- Players in lobby -->
                <div :class="styles.player_config_section">
                    <h3 :class="styles.h3">Players in Game ({{ totalPlayers }}/5)</h3>
                    <div :class="styles.player_list">
                        <div v-for="(player, index) in lobbyPlayers" :key="player.id" :class="styles.player_item">
                            <span>{{ player.name }} {{ player.id === currentPlayerId ? '(You)' : '' }}</span>
                            <span>👤</span>
                        </div>
                    </div>
                    <p :class="styles.waiting_text">Waiting for host to start the game...</p>
                </div>
            </div>
        </div>
        <div :class="styles.start_button_container">
            <button :class="styles.back_button" @click="leaveGame">
                <h2 :class="styles.h2">Leave Game</h2>
            </button>
        </div>
    </div>

</template>

<script setup>
import styles from './setup.module.css';
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation, useQuery, useApolloClient, useSubscription } from '@vue/apollo-composable';
import { CREATE_GAME, JOIN_GAME, GET_GAME, GAME_UPDATED, START_GAME } from '../../graphql/queries';

const router = useRouter();

const showNameModal = ref(true);
const playerName = ref('');
const gameMode = ref(''); // 'create', 'join', 'lobby', or ''
const createdGameId = ref(''); // Store the created game ID

// Join game state
const joinGameId = ref('');
const joinGameError = ref('');
const currentPlayerId = ref(''); // Player ID for joined players
const lobbyPlayers = ref([]); // Players in the lobby

const totalPlayers = computed(() => {
    if (gameMode.value === 'lobby') {
        return lobbyPlayers.value.length;
    }
    return 1; // Just the current player initially
});

const currentPlayerCount = computed(() => {
    // Use real-time data if available, otherwise fallback to static count
    return lobbyPlayers.value.length > 0 ? lobbyPlayers.value.length : totalPlayers.value;
});

const { mutate: createGame, loading: creatingGame, error: createGameError } = useMutation(CREATE_GAME);
const { mutate: joinGame, loading: joiningGame, error: joinGameGraphQLError } = useMutation(JOIN_GAME);
const { mutate: startGame, loading: startingGame } = useMutation(START_GAME);
const { resolveClient } = useApolloClient();

const subscriptionEnabled = ref(false);
const subscriptionGameId = ref('');

const { result: subscriptionResult } = useSubscription(
  GAME_UPDATED,
  () => ({ gameId: subscriptionGameId.value }),
  () => ({ enabled: subscriptionEnabled.value && !!subscriptionGameId.value })
);

watch(subscriptionResult, (newResult) => {
  if (newResult?.gameUpdated) {
    console.log('Game updated via subscription:', newResult.gameUpdated);
    console.log('Current game mode:', gameMode.value);
    console.log('Current player ID:', currentPlayerId.value);
    console.log('Game status:', newResult.gameUpdated.status);

    // Update lobby players if in lobby mode
    if (gameMode.value === 'lobby' || gameMode.value === 'create') {
      lobbyPlayers.value = newResult.gameUpdated.players;

      // Check if game has started (transition from setup to game)
      if (newResult.gameUpdated.status === 'PLAYING') {
        console.log('Game started! Navigating to game page...');
        console.log('Navigation params:', {
          gameId: createdGameId.value,
          playerId: currentPlayerId.value
        });
        // Navigate to game page for all players
        router.push({
          path: '/game',
          query: { gameId: createdGameId.value, playerId: currentPlayerId.value }
        });
      }
    }
  }
});

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
        // Create game with just the player (other players will join later)
        const playerNames = [playerName.value.trim()];

        console.log('Creating initial game with players:', playerNames);

        const result = await createGame({
            playerNames
        });

        if (result?.data?.createGame?.id) {
            const gameId = result.data.createGame.id;
            console.log('Initial game created with ID:', gameId);

            // Store the game ID and show the create screen (host can configure)
            createdGameId.value = gameId;
            currentPlayerId.value = '0'; // Host is always player 0
            gameMode.value = 'create';

            // Start subscription for real-time updates
            startGameSubscription();
        }
    } catch (error) {
        console.error('Error creating initial game:', error);
        alert('Failed to create game. Please try again.');
    }
}

function goBack() {
    stopGameSubscription();
    gameMode.value = '';
    createdGameId.value = '';
    joinGameId.value = '';
    joinGameError.value = '';
    currentPlayerId.value = '';
    lobbyPlayers.value = [];
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

async function joinCreatedGame() {
    try {
        // Call startGame mutation to officially start the game for all players
        console.log('Host starting game:', createdGameId.value);

        const result = await startGame({
            gameId: createdGameId.value
        });

        if (result?.data?.startGame.success) {
            console.log('Game started successfully');
            // Navigation will happen automatically via subscription when status becomes 'PLAYING'
        }
    } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
    }
}

async function joinExistingGame() {
    try {
        joinGameError.value = '';

        const result = await joinGame({
            gameId: joinGameId.value.trim(),
            playerName: playerName.value.trim()
        });

        if (result?.data?.joinGame?.id) {
            const gameId = result.data.joinGame.id;
            console.log('Successfully joined game:', gameId);

            // Set up lobby state for joined player
            createdGameId.value = gameId;
            currentPlayerId.value = result.data.joinGame.playerId.toString();
            gameMode.value = 'lobby'; // New lobby state for joined players

            // Load current game state for lobby display
            await loadGameState();

            // Start subscription for real-time updates
            startGameSubscription();
        }
    } catch (error) {
        console.error('Error joining game:', error);
        joinGameError.value = error.message || 'Failed to join game. Please check the Game ID and try again.';
    }
}

async function loadGameState() {
    try {
        const client = resolveClient();
        const { data } = await client.query({
            query: GET_GAME,
            variables: {
                id: createdGameId.value,
                playerId: currentPlayerId.value
            }
        });

        if (data?.game) {
            lobbyPlayers.value = data.game.players;
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

function leaveGame() {
    // TODO: Implement leave game mutation on server
    // For now, just go back to main menu
    stopGameSubscription();
    goBack();
}

function startGameSubscription() {
    if (!createdGameId.value) {
        console.log('No game ID available for subscription');
        return;
    }

    console.log('Starting subscription for game:', createdGameId.value);
    console.log('Current subscription state:', {
        enabled: subscriptionEnabled.value,
        gameId: subscriptionGameId.value
    });

    subscriptionGameId.value = createdGameId.value;
    subscriptionEnabled.value = true;

    console.log('Updated subscription state:', {
        enabled: subscriptionEnabled.value,
        gameId: subscriptionGameId.value
    });
}

function stopGameSubscription() {
    console.log('Stopping game subscription');
    subscriptionEnabled.value = false;
    subscriptionGameId.value = '';
}

</script>
