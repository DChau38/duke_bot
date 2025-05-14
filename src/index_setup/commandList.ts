export const OUR_COMMANDS = [
    {
        name: 'test',
        description: 'Test if the API is working.',
    },
    {
        name: 'reply',
        description: 'Receive a reply to confirm the bot is responsive.',
    },
    {
        name: 'coinflip',
        description: 'Flip a coin to see if it lands heads or tails! 🍀',
    },
    {
        name: 'hangman',
        description: 'Play Hangman with your friends and guess the word before it’s too late! 🎮🔤',
    },
    {
        name: 'joinvc',
        description: 'Make the bot join your voice channel. 🎧',
    },
    {
        name: 'attack',
        description: 'Send a friendly attack image to another user. 💥🖼️ (with a secret easter egg :)',
        options: [
            {
                type: 6, // Type 6 corresponds to a `User` type argument
                name: 'target',
                description: 'The user to attack with a random image.',
                required: true,
            },
        ],
    },
    {
        name: 'sleep',
        description: 'Ever want to check how long you’ve slept?🛌💤  15m grace period upon entering Discord after sleep',
        options: [
            {
                type: 6, // Type 6 corresponds to a `User` type argument
                name: 'target',
                description: 'The user whose sleep status to check.',
                required: false,
            },
            {
                type: 3, // Type 3 is for a string
                name: "sorting_argument",
                description: "Optional: Examples: a/alphabetize",
                required: false,


            },
            {
                type: 3,
                name: 'timezone',
                description: "Optional: Examples: EST (default),PDF,UTC...",
                required: false,
            },
            {
                type: 3,
                name: 'postpone',
                description: 'Optional: Enter "yes" to retain current sleep record 15m+ later',
                required: false,
            }
        ],
    },
    {
        name: 'arena',
        description: 'Roll dice to kick out your friends in a voice call! 🎲',
        options: [
            {
                type: 3, // Type 3 corresponds to a string input
                name: 'opponents',
                description: 'The users to compete against, separated by a space.',
                required: true,
            },
        ],
    },
    {
        name: 'timerset',
        description: 'Set a timer to reminder yourself of something',
        options: [
            {
                type: 3, // string
                name: 'description',
                description: 'The description for the timer alert',
                required: true,
            },
            {
                type: 3, // string
                name: 'hours',
                description: 'The amount of hours you want added to the timer',
                required: false,
            },
            {
                type: 3, // string
                name: 'minutes',
                description: 'The amount of minutes you want added to the timer',
                required: false,
            },


        ]
    },
    {
        name: 'timersshow',
        description: 'Display all active server timers with optional sorting. ⏱️',
        options: [
            {
                type: 3, // Type 3 is for string input
                name: 'sorting_argument',
                description: '(alphabetical, finishingTime)',
                required: false,
            },
        ],
    },

];
