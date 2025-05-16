export const OUR_COMMANDS = [
    {
        name: 'test',
        description: '<dev> Run test functionality. (e.g., /test)',
    },
    {
        name: 'reply',
        description: '<dev> Receive a reply to confirm the bot is responsive. (e.g., /reply)',
    },
    {
        name: 'coinflip',
        description: 'Flip a coin to see if it lands heads or tails! 🍀 (e.g., /coinflip)',
    },
    {
        name: 'hangman',
        description: 'Play Hangman with your friends and guess the word before time runs out! 🎮🔤 (e.g., /hangman)',
    },
    {
        name: 'joinvc',
        description: 'Make the bot join your voice channel. 🎧 (e.g., /joinvc)',
    },
    {
        name: 'attack',
        description: 'Send a friendly attack image to another user. 💥🖼️ (e.g., /attack @username)',
        options: [
            {
                type: 6, // Type 6 corresponds to a `User` type argument
                name: 'target',
                description: 'Choose a user to attack. (e.g., @username)',
                required: true,
            },
        ],
    },
    {
        name: 'sleep',
        description: 'Check how long someone’s slept. 🛌💤 15m grace after login. (e.g., /sleep)',
        options: [
            {
                type: 6, // Type 6 corresponds to a `User` type argument
                name: 'target',
                description: 'User to check sleep status for.',
                required: false,
            },
            {
                type: 3, // Type 3 is for a string
                name: "sorting_argument",
                description: "Optional: (e.g., a/alphabetize)",
                required: false,


            },
            {
                type: 3,
                name: 'timezone',
                description: "Optional: (e.g., EST, UTC, PST)",
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
        description: 'Roll dice to kick out your VC friends! 🎲 (e.g., /arena user1 user2)',
        options: [
            {
                type: 3, // Type 3 corresponds to a string input
                name: 'opponents',
                description: 'Users to compete with. (e.g., user1 user2 ...)',
                required: true,
            },
        ],
    },
    {
        name: 'timerset',
        description: 'Set a timer to remind yourself. (e.g., /timerset bioTestTmr 24',
        options: [
            {
                type: 3, // string
                name: 'description',
                description: 'Reminder. (e.g., Take a break)',
                required: true,
            },
            {
                type: 3, // string
                name: 'hours',
                description: 'How many hours to add. (e.g., 1, 2.5, 5+5)',
                required: false,
            },
            {
                type: 3, // string
                name: 'minutes',
                description: 'How many minutes to add. (e.g., 15, 60*3)',
                required: false,
            },


        ]
    },
    {
        name: 'timersshow',
        description: 'View active server timers with optional sorting. ⏱️. (e.g., /timersshow',
        options: [
            {
                type: 3, // Type 3 is for string input
                name: 'sorting_argument',
                description: 'Sort method. (e.g., alphabetical, finishingTime)',
                required: false,
            },
        ],
    },
    {
        name: 'notepadset',
        description: 'Add something new to the notepad. 📝. (e.g., /notepadset newInformation',
        options: [
            {
                type: 3, // Type 3 is for string input
                name: 'new_information',
                description: 'What information you want to add. (e.g., newPassword=xyzabc)',
                required: true,
            },
        ],
    },
    {
        name: 'notepadshow',
        description: 'View Current Notepad. 📝. (e.g., /notepadshow',
    },
];
