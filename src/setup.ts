import { Client, GatewayIntentBits, TextChannel, ChannelType } from 'discord.js'
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
const commands = [
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
        name: 'timer',
        description: 'Set a timer to reminder yourself of something',
        options: [
            {
                type: 3, // string
                name: 'description',
                description: 'The description for the timer alert',
                requried: true,
            },
            {
                type: 4, // integer
                name: 'hours',
                description: 'The amount of hours you want added to the timer',
                requried: false,
            },
            {
                type: 4, // integer
                name: 'minutes',
                description: 'The amount of minutes you want added to the timer',
                requried: false,
            },

        ]
    },

];



export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,

    ]
});

// Tracker structure: Maps server ID to a map of users and their associated time
export const tracker: Map<string, Map<string, string | null>> = new Map();

// Async function for login with error handling
export async function startBot() {
    try {
        if (!process.env.DISCORD_BOT_TOKEN) {
            throw new Error('Bot token is not defined in environment variables');
        }

        await client.login(process.env.DISCORD_BOT_TOKEN);
        console.log('(1) LOGIN: SUCCESS');

        await registerSlashCommands();
    } catch (error) {
        console.error('(1) LOGIN: FAIL-', error);
    }
}


async function registerSlashCommands() {
    try {
        // get variables (commands above)
        const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
        const CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;

        const rest = new REST({ version: '10' }).setToken(TOKEN);  // Initialize REST client

        // Register commands globally with Discord
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),  // This registers the commands globally
            { body: commands }  // Body of the request, containing the commands
        );

        console.log('REGISTER COMMANDS: SUCCESS');
    } catch (error) {
        console.error('REGISTER COMMANDS: FAILURE', error);  // Handle errors during command registration
    }
}