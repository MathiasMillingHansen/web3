<template>
    <div :class="styles.game_container">
        <div v-if="appState === 'loading'" :class="styles.loading">
            <h2>Loading game...</h2>
        </div>

        <div v-else-if="appState === 'error'" :class="styles.error">
            <h2>Error loading game</h2>
            <p>{{ gameError.message }}</p>
        </div>

        <template v-else-if="appState === 'game'">
            <!-- Deck Area -->
            <div :class="styles.deck_area">
                <h3>Top Card</h3>
                <div :class="topCardDisplay.classes">
                    {{ topCardDisplay.text }}
                </div>

                <button @click="drawCard" :disabled="drawButtonConfig.disabled" :class="styles.draw_button">
                    {{ drawButtonConfig.text }}
                </button>

                <button @click="sayUno(currentUserId)" :class="styles.draw_button">
                    Say UNO
                </button>
            </div>

            <!-- Player Area -->
            <div :class="styles.player_area">
                <h2 :class="[styles.h2, styles[turnStatusConfig.class]]">
                    {{ turnStatusConfig.text }}
                </h2>

                <!-- Player Hand Cards -->
                <div :class="styles.cards_container">
                    <div v-for="(card, index) in playerHand" :key="card.id || index"
                        :class="[styles.card, styles[getCardColorClass(card)]]" @click="handleCardClick(card, index)"
                        :style="{ opacity: isMyTurn ? 1 : 0.6 }">
                        {{ formatCard(card) }}
                    </div>
                    <div v-if="playerHand.length === 0" :class="styles.no_cards">
                        No cards
                    </div>
                </div>

                <!-- Color Selection Modal for Wild Cards -->
                <div v-if="showColorSelector" :class="styles.color_selector_overlay">
                    <div :class="styles.color_selector_modal">
                        <h3>Choose a color for your wild card:</h3>
                        <div :class="styles.color_options">
                            <button :class="[styles.color_button, styles.color_red]" @click="selectColor('RED')">
                                Red
                            </button>
                            <button :class="[styles.color_button, styles.color_yellow]" @click="selectColor('YELLOW')">
                                Yellow
                            </button>
                            <button :class="[styles.color_button, styles.color_green]" @click="selectColor('GREEN')">
                                Green
                            </button>
                            <button :class="[styles.color_button, styles.color_blue]" @click="selectColor('BLUE')">
                                Blue
                            </button>
                        </div>
                        <button :class="styles.cancel_button" @click="cancelColorSelection">
                            Cancel
                        </button>
                    </div>
                </div>

                <!-- Win Modal -->
                <div v-if="winModalConfig" :class="styles.win_modal_overlay">
                    <div :class="styles.win_modal">
                        <div :class="styles.win_content">
                            <h2>🎉 Game Over! 🎉</h2>
                            <div :class="styles[winModalConfig.class]">
                                <h3>{{ winModalConfig.title }}</h3>
                                <p>{{ winModalConfig.message }}</p>
                            </div>
                            <div :class="styles.win_actions">
                                <button :class="styles.back_to_setup_button" @click="goBackToSetup">
                                    Back to Setup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Game Status -->
            <div :class="styles.game_status">
                <h3>Game Status</h3>
                <p>Current Player: {{ players[currentPlayer]?.name || 'Unknown' }}</p>
                <p>Direction: {{ game.direction === 1 ? 'Clockwise' : 'Counter-clockwise' }}</p>
                <p>Click on player to catch UNO!</p>
                <div :class="styles.players_list">
                    <div v-for="(player, index) in players" :key="player.id"
                        :class="[styles.player_status, { [styles.current_player]: index === currentPlayer }]"
                        @click="catchUno(player.id)">
                        {{ player.name }} ({{ player.handSize }} cards)
                        <span v-if="player.hasDeclaredUno">has UNO!</span>
                        👤
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import styles from './Game.module.css';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuery, useMutation, useSubscription } from '@vue/apollo-composable';
import { GET_GAME, PLAY_CARD, DRAW_CARD, DECLARE_UNO, CATCH_UNO, GAME_UPDATED } from '../../graphql/queries';

const route = useRoute();
const router = useRouter();
const gameId = route.query.gameId;
const currentUserId = route.query.playerId;

console.log('Game page - Player ID:', currentUserId, 'Game ID:', gameId);

const { result: gameResult, loading: gameLoading, error: gameError } = useQuery(GET_GAME, {
    id: gameId,
    playerId: currentUserId
}, {
    fetchPolicy: 'cache-and-network'
});

const { mutate: playCardMutation, loading: playingCard } = useMutation(PLAY_CARD);
const { mutate: drawCardMutation, loading: drawingCard } = useMutation(DRAW_CARD);
const { mutate: declareUnoMutation } = useMutation(DECLARE_UNO);
const { mutate: catchUnoMutation } = useMutation(CATCH_UNO);

const { result: subscriptionResult } = useSubscription(GAME_UPDATED, {
    gameId: gameId
});

const game = computed(() => {
    if (subscriptionResult.value?.gameUpdated) {
        return subscriptionResult.value.gameUpdated;
    }
    return gameResult.value?.game;
});

const players = computed(() => game.value?.players || []);
const currentPlayer = computed(() => game.value?.currentPlayer || 0);
const topCard = computed(() => game.value?.topCard);

const playerHand = computed(() => {
    const currentPlayerData = players.value.find(p => p.id === currentUserId);
    return currentPlayerData?.cards || [];
});

const isMyTurn = computed(() => currentPlayer.value.toString() === currentUserId);

const gameWinner = computed(() => {
    if (!players.value || players.value.length === 0) return null;
    const winner = players.value.find(player => player.handSize === 0);
    return winner || null;
});

const showColorSelector = ref(false);
const selectedCardIndex = ref(null);

const appState = computed(() => {
    if (gameLoading.value) return 'loading';
    if (gameError.value) return 'error';
    if (game.value) return 'game';
    return 'empty';
});

const turnStatusConfig = computed(() => {
    return isMyTurn.value 
        ? { text: 'Your turn!', class: 'my_turn' }
        : { text: 'Waiting for turn', class: 'waiting_turn' };
});

const topCardDisplay = computed(() => {
    if (!topCard.value) {
        return { 
            text: 'No cards', 
            classes: [styles.deck, styles.card_default] 
        };
    }
    
    return {
        text: formatCard(topCard.value),
        classes: [styles.deck, styles[getCardColorClass(topCard.value, game.value?.topColor)]]
    };
});

const winModalConfig = computed(() => {
    if (!gameWinner.value) return null;
    
    const isWinner = gameWinner.value.id === currentUserId;
    return {
        title: isWinner ? '🏆 Congratulations! You Won! 🏆' : `${gameWinner.value.name} Won!`,
        message: isWinner ? "Great job! You've won this UNO game!" : 'Better luck next time!',
        class: isWinner ? 'win_message' : 'lose_message'
    };
});

const drawButtonConfig = computed(() => {
    return {
        text: drawingCard.value ? 'Drawing...' : 'Draw Card',
        disabled: !isMyTurn.value || drawingCard.value
    };
});

function handleCardClick(card, index) {
    if (!isMyTurn.value || playingCard.value) {
        console.log('Not your turn or already playing a card');
        return;
    }

    if (card.type === 'WILD' || card.type === 'WILD DRAW') {
        selectedCardIndex.value = index;
        showColorSelector.value = true;
    } else {
        playCard(index);
    }
}

function selectColor(color) {
    if (selectedCardIndex.value !== null) {
        playCard(selectedCardIndex.value, color);
    }
    cancelColorSelection();
}

function cancelColorSelection() {
    showColorSelector.value = false;
    selectedCardIndex.value = null;
}

function formatCard(card) {
    if (!card) return '';
    switch (card.type) {
        case 'NUMBERED':  return `${card.number}`;
        case 'WILD':      return '🎨';
        case 'WILD DRAW': return '+4🎨';
        case 'DRAW':      return '+2';
        case 'REVERSE':   return '↩️';
        case 'SKIP':      return '⊘';
        default:          return '';
    }
}

function getCardColorClass(card, chosenColor = undefined) {
    if (!card) return 'card_default';

    if (card.type === 'WILD' || card.type === 'WILD DRAW') {
        return chosenColor ? `card_${chosenColor.toLowerCase()}` : 'card_wild';
    }

    if (card.color) {
        return `card_${card.color.toLowerCase()}`;
    }

    return 'card_default';
}

async function playCard(index, color = null) {
    console.log('PlayCard attempt:', {
        isMyTurn: isMyTurn.value,
        currentUserId,
        currentPlayer: currentPlayer.value,
        cardIndex: index,
        color,
        gameId
    });

    if (!isMyTurn.value || playingCard.value) {
        console.log('Not your turn or already playing a card');
        return;
    }

    try {
        const variables = {
            gameId,
            playerId: currentUserId,
            cardIndex: index
        };

        if (color) {
            variables.color = color;
        }

        const result = await playCardMutation(variables);
        console.log('Card played successfully:', result);
    } catch (error) {
        console.error('Error playing card:', error);
        alert('Failed to play card: ' + error.message);
    }
}

async function drawCard() {
    console.log('DrawCard attempt:', {
        isMyTurn: isMyTurn.value,
        currentUserId,
        currentPlayer: currentPlayer.value,
        gameId
    });

    if (!isMyTurn.value || drawingCard.value) {
        console.log('Not your turn or already drawing a card');
        return;
    }

    try {
        const result = await drawCardMutation({
            gameId,
            playerId: currentUserId
        });

        console.log('Card drawn successfully:', result);
    } catch (error) {
        console.error('Error drawing card:', error);
        alert('Failed to draw card: ' + error.message);
    }
}

function goBackToSetup() {
    router.push('/setup');
}

async function sayUno(playerId) {
    try {
        const result = await declareUnoMutation({
            gameId,
            playerId
        });

    } catch (error) {
        console.error('Error declaring UNO:', error);
        alert('Failed to declare UNO: ' + error.message);
    }
}

async function catchUno(playerId) {
    try {
        const result = await catchUnoMutation({
            gameId,
            playerId
        });

        console.log('UNO caught successfully:', result);
    } catch (error) {
        console.error('Error catching UNO:', error);
        alert('Failed to catch UNO: ' + error.message);
    }
}

onMounted(() => {
    if (!gameId) {
        console.error('No game ID provided');
        return;
    }
    console.log('Loading game with ID:', gameId);
});

watch(game, (newGame) => {
    if (newGame) {
        console.log('Game updated:', newGame);
    }
}, { deep: true });

watch(subscriptionResult, (newResult) => {
    if (newResult?.gameUpdated) {
        console.log('Game updated via subscription:', newResult.gameUpdated);
    }
}, { deep: true });

</script>
