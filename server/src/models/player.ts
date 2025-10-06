class Player
{
    name : string;

    constructor(name : string)
    {
        this.name = name;
    }

    getName() : string
    {
        return this.name;
    }

    setName(name : string) : void
    {
        this.name = name;
    }
}

export { Player };