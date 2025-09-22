
<template>
    <Header/>
    <div :class="styles.button_container">
        <router-link :to="'/setup'" custom v-slot="{ navigate, href }">
            <button :class="styles.button" :href="href" @click="handleClick(navigate)">
                <h2 :class="styles.h2">START</h2>
            </button>
        </router-link>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import styles from './home.module.css';
import Header from '../../components/Header.vue';

const hoverSound = ref(new Audio('public/sounds/sfx-gamestart-end.mp3'));

function playHoverSound() {
    hoverSound.value.currentTime = 0;
    hoverSound.value.play();
}

function handleClick(navigate) {
    playHoverSound();
    navigate();
}
</script>
