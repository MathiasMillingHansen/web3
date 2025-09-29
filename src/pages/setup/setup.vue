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
        <h1 :class="styles.h1">Create Game</h1>
        <div :class="styles.setup_body">
            <div :class="styles.player_list">
                <div :class="styles.player_item">
                    <span>{{ playerName }} (You)</span>
                </div>
                <div :class="styles.player_item">
                    <span>Bot 1</span>
                </div>
            </div>
        </div>
        <div :class="styles.start_button_container">
            <button :class="styles.start_button" @click="startGame" :disabled="creatingGame">
                <h2 :class="styles.h2">
                    {{ creatingGame ? 'CREATING GAME...' : 'START GAME' }}
                </h2>
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@vue/apollo-composable';
import { CREATE_GAME } from '../../graphql/queries';

const router = useRouter();

// State management
const showNameModal = ref(true);
const playerName = ref('');
const gameMode = ref(''); // 'create', 'join', or ''

// GraphQL mutation for creating a game
const { mutate: createGame, loading: creatingGame, error: createGameError } = useMutation(CREATE_GAME);

function submitName() {
    if (playerName.value.trim() !== '') {
        showNameModal.value = false;
    }
}

function setGameMode(mode) {
    gameMode.value = mode;
}

function goBack() {
    gameMode.value = '';
}

async function startGame() {
    try {
        // Create game with player and one bot
        const playerNames = [playerName.value.trim(), 'Bot 1'];
        
        console.log('Creating game with players:', playerNames);
        
        const result = await createGame({
            playerNames
        });
        
        if (result?.data?.createGame?.id) {
            const gameId = result.data.createGame.id;
            console.log('Game created with ID:', gameId);
            
            // Navigate to game with player ID 0 (first player)
            router.push({
                path: '/game',
                query: { gameId, playerId: '0' }
            });
        }
    } catch (error) {
        console.error('Error creating game:', error);
        alert('Failed to create game. Please try again.');
    }
}
</script>