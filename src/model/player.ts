class Player
{
    isBot : boolean;
    name : string;

    constructor(isBot : boolean, name : string)
    {
        this.isBot = isBot;
        this.name = name;
    }

    getName() : string
    {
        return this.name;
    }
    getIsBot() : boolean
    {
        return this.isBot;
    }

    setName(name : string) : void
    {
        this.name = name;
    }
    setIsBot(isBot : boolean) : void
    {
        this.isBot = isBot;
    }

     
}

export { Player };