<template>
    <div :class="styles.game_container">
        <!-- Loading State -->
        <div v-if="gameLoading" :class="styles.loading">
            <h2>Loading game...</h2>
        </div>
        
        <!-- Error State -->
        <div v-else-if="gameError" :class="styles.error">
            <h2>Error loading game</h2>
            <p>{{ gameError.message }}</p>
        </div>
        
        <!-- Game Content -->
        <template v-else-if="game">
            <!-- Deck Area -->
            <div :class="styles.deck_area">
                <h3>Top Card</h3>
                <div v-if="topCard" :class="[styles.deck, styles[getCardColorClass(topCard)]]">
                    {{ formatCard(topCard) }}
                </div>
                <div v-else :class="[styles.deck, styles.card_default]">
                    No cards
                </div>
                
                <!-- Draw Card Button -->
                <button 
                    @click="drawCard" 
                    :disabled="!isMyTurn || drawingCard"
                    :class="styles.draw_button"
                >
                    {{ drawingCard ? 'Drawing...' : 'Draw Card' }}
                </button>
            </div>

            <!-- Player Area -->
            <div :class="styles.player_area">
                <h2 :class="styles.h2">
                    Your Cards ({{ players[0]?.name || 'Player' }}) 
                    <span v-if="!isMyTurn" style="color: #999;">- Waiting for turn</span>
                    <span v-else style="color: #4CAF50;">- Your turn!</span>
                </h2>
                
                <!-- Player Hand Cards (Mock for now since we can't see actual hand from server) -->
                <div :class="styles.cards_container">
                    <div 
                        v-for="(card, index) in playerHand" 
                        :key="card.id || index"
                        :class="[styles.card, styles[getCardColorClass(card)]]"
                        @click="playCard(index)"
                        :style="{ opacity: isMyTurn ? 1 : 0.6 }"
                    >
                        {{ formatCard(card) }}
                    </div>
                    <div v-if="playerHand.length === 0" :class="styles.no_cards">
                        No cards
                    </div>
                </div>
            </div>
            
            <!-- Game Status -->
            <div :class="styles.game_status">
                <h3>Game Status</h3>
                <p>Current Player: {{ players[currentPlayer]?.name || 'Unknown' }}</p>
                <p>Direction: {{ game.direction === 1 ? 'Clockwise' : 'Counter-clockwise' }}</p>
                <div :class="styles.players_list">
                    <div 
                        v-for="(player, index) in players" 
                        :key="player.id"
                        :class="[styles.player_status, { [styles.current_player]: index === currentPlayer }]"
                    >
                        {{ player.name }} ({{ player.handSize }} cards)
                        {{ player.isBot ? '🤖' : '👤' }}
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import styles from './Game.module.css';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { GET_GAME, PLAY_CARD, DRAW_CARD } from '../../graphql/queries';

const route = useRoute();
const gameId = route.query.gameId;

// Get current user's player index (assuming first player is always the user)
const currentUserId = '0';

// GraphQL queries and mutations
const { result: gameResult, loading: gameLoading, error: gameError } = useQuery(GET_GAME, {
  id: gameId,
  playerId: currentUserId
}, {
  pollInterval: 1000, // Poll every second for updates
});

const { mutate: playCardMutation, loading: playingCard } = useMutation(PLAY_CARD);
const { mutate: drawCardMutation, loading: drawingCard } = useMutation(DRAW_CARD);

// Computed properties from GraphQL data
const game = computed(() => gameResult.value?.game);
const players = computed(() => game.value?.players || []);
const currentPlayer = computed(() => game.value?.currentPlayer || 0);
const topCard = computed(() => game.value?.topCard);

// Get current user's cards
const playerHand = computed(() => {
  const currentPlayerData = players.value.find((p: any) => p.id === currentUserId);
  return currentPlayerData?.cards || [];
});

const isMyTurn = computed(() => currentPlayer.value.toString() === currentUserId);

function formatCard(card: any): string {
    if (!card) return '';
    if (card.type === 'NUMBERED') {
        return `${card.number}`;
    } else if (card.type === 'WILD') {
        return '🌟';
    } else if (card.type === 'WILD DRAW') {
        return '+4';
    } else if (card.type === 'DRAW') {
        return '+2';
    } else if (card.type === 'REVERSE') {
        return '↩️';
    } else if (card.type === 'SKIP') {
        return '⊘';
    } else {
        return card.type || '';
    }
}

function getCardColorClass(card: any): string {
    if (!card) return 'card_default';
    if (card.type === 'WILD' || card.type === 'WILD DRAW') {
        return 'card_wild';
    }
    if (card.color) {
        return `card_${card.color.toLowerCase()}`;
    }
    return 'card_default';
}

async function playCard(index: number) {
    if (!isMyTurn.value || playingCard.value) {
        console.log('Not your turn or already playing a card');
        return;
    }
    
    try {
        const result = await playCardMutation({
            gameId,
            playerId: currentUserId,
            cardIndex: index
        });
        
        console.log('Card played successfully:', result);
    } catch (error) {
        console.error('Error playing card:', error);
        alert('Failed to play card: ' + error.message);
    }
}

async function drawCard() {
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

onMounted(() => {
    if (!gameId) {
        console.error('No game ID provided');
        return;
    }
    console.log('Loading game with ID:', gameId);
});

// Watch for game updates and log them
watch(game, (newGame) => {
    if (newGame) {
        console.log('Game updated:', newGame);
    }
}, { deep: true });

</script>