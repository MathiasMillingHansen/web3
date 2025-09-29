<template>

    <div v-if="showModal" :class="styles.modal_overlay">
        <div :class="styles.modal">
            <h2>Enter your name</h2>
            <input v-model="usernameInput" :class="styles.modal_input" placeholder="Your name"
                @keyup.enter="submitName" />
            <button :class="styles.modal_button" @click="submitName">OK</button>
        </div>
    </div>

    <div :class="styles.setup_header">
        <h1 :class="styles.h1">Setup Game</h1>
    </div>

    <div :class="styles.setup_body">

        <div v-for="(player, index) in players" :key="player" :class="styles.setup_button_container">
            <button v-if="player" :class="styles.setup_button">
                <h2 :class="styles.h2">{{ player.getName() }}</h2>
            </button>

            <button v-else :class="styles.setup_button" @click="addPlayer(index)">
                <h2 :class="styles.h2">Add Bot</h2>
            </button>

            <button v-if="player" :class="styles.setup_remove_button" @click="players[index] = null">
                <h2 :class="styles.h2">X</h2>
            </button>

        </div>

    </div>

    <div :class="styles.start_button_container">
        <button 
            :class="styles.start_button" 
            @click="startGame" 
            :disabled="players[0] == null || creatingGame"
        >
            <h2 :class="styles.h2">
                {{ creatingGame ? 'CREATING GAME...' : 'START GAME' }}
            </h2>
        </button>
        <div v-if="createGameError" style="color: red; margin-top: 10px;">
            Error: {{ createGameError.message }}
        </div>
    </div>

</template>

<script setup>
import styles from './setup.module.css';
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@vue/apollo-composable';
import { Player } from '../../model/player.ts';
import { CREATE_GAME } from '../../graphql/queries';

const router = useRouter();
const players = ref([null, null, null, null, null]);

const showModal = ref(true);
const usernameInput = ref('');

// GraphQL mutation for creating a game
const { mutate: createGame, loading: creatingGame, error: createGameError } = useMutation(CREATE_GAME);

function submitName() {
    if (usernameInput.value.trim() !== '') {
        players.value[0] = new Player(false, usernameInput.value.trim());
        showModal.value = false;
    }
}

watch(players, (newPlayers) => {
    console.log(players.value);
    if (newPlayers[0] == null) {
        showModal.value = true;
    }
}, { deep: true });

function addPlayer(index) {
    if (index !== -1) {
        players.value[index] = new Player(true, `Bot ${index + 1}`);
    }
}

async function startGame() {
    try {
        const playerNames = players.value
            .filter(p => p !== null)
            .map(p => p.getName());
        
        console.log('Creating game with players:', playerNames);
        
        const result = await createGame({
            playerNames
        });
        
        if (result?.data?.createGame?.id) {
            const gameId = result.data.createGame.id;
            console.log('Game created with ID:', gameId);
            
            // Navigate to game with GraphQL game ID
            router.push({
                path: '/game',
                query: { gameId }
            });
        }
    } catch (error) {
        console.error('Error creating game:', error);
        alert('Failed to create game. Please try again.');
    }
}

</script>