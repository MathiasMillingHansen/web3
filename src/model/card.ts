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

const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'] as const

type Color = (typeof colors)[number]

type TypedCard<T extends Card['type']> = Extract<Card, { type: T }>;

export { type Card, type Color, colors, type NumberedCard, type SkipCard, type ReverseCard, type DrawCard, type WildCard, type WildDrawCard }
