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

type ColouredCard = NumberedCard | SkipCard | ReverseCard | DrawCard;

type WildCards = WildCard | WildDrawCard;

type Type = Card['type'];

type Card = NumberedCard | SkipCard | ReverseCard | DrawCard | WildCard | WildDrawCard

const colors = ['RED', 'GREEN', 'BLUE', 'YELLOW'] as const

type Color = (typeof colors)[number]

type TypedCard<T extends Type> = Extract<Card, { type: T }>;

function isColor(value: string): value is Color {
  return colors.includes(value as Color);
}

export { type Card, type Color, colors, type NumberedCard, type SkipCard, type ReverseCard, type DrawCard, type WildCard, type WildDrawCard, type ColouredCard, type WildCards, type Type, type TypedCard, isColor }
