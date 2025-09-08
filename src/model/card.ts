type NumberedCard = {
    type: 'NUMBERED'
    color: Color
    number: number
}

type SkipCard = {
    type: 'SKIP'
    color: Color
}

type ReverseCard = {
    type: 'REVERSE'
    color: Color
}

type DrawCard = {
    type: 'DRAW'
    color: Color
}

type WildCard = {
    type: 'WILD'
}

type WildDrawCard = {
    type: 'WILD DRAW'
}

type Card = NumberedCard | SkipCard | ReverseCard | DrawCard | WildCard | WildDrawCard

const Colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'] as const

type Color = (typeof Colors)[number]

export { type Card, Colors, type NumberedCard, type SkipCard, type ReverseCard, type DrawCard, type WildCard, type WildDrawCard }