<template>

    <div v-if="showModal" :class="styles.modal_overlay">
        <div :class="styles.modal">
            <h2>Enter your name</h2>
            <input v-model="usernameInput" :class="styles.modal_input" placeholder="Your name" @keyup.enter="submitName" />
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

</template>

<script setup>
import styles from './setup.module.css';
import { ref, watch } from 'vue';
import { Player } from '../../model/player.ts';

const players = ref([null, null, null, null, null]);

const showModal = ref(true);
const usernameInput = ref('');

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

</script>