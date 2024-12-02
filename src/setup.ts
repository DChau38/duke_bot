import {Client, GatewayIntentBits,TextChannel,ChannelType} from 'discord.js'
import {REST,Routes} from 'discord.js';
import 'dotenv/config';

const commands = [
    {
      name: 'arena',
      description: 'Play roulette with mentioned users in a voice channel.',
    },
    {
        name: 'hangman',
        description: 'Play Hangman with your friends'
    },
    {
        name:'coinflip',
        description: 'Flip a coin'
    },
    {
      name: 'joinvc',
      description: 'Make the bot join your current voice channel.',
    },
    {
      name: 'attack',
      description: 'Send a happy attack image to the mentioned user.',
      options:[
        {
            type:6, // 6 is a user
            name:'target',
            description:'The user to be attacked',
            required:true,
        }
      ],
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

export const tracker:{[username:string]:string}={};

// Async function for login with error handling
export async function startBot() {
    try {
        if (!process.env.DISCORD_BOT_TOKEN) {
            throw new Error('Bot token is not defined in environment variables');
        }
        
        await client.login(process.env.DISCORD_BOT_TOKEN);
        console.log('(1) LOGIN: SUCCESS');

        //await registerSlashCommands();
    } catch (error) {
        console.error('(1) LOGIN: FAIL-', error);
    }
}


async function registerSlashCommands() {
    try {
        // get variables (commands above)
        const TOKEN = process.env.DISCORD_BOT_TOKEN as string;
        const CLIENT_ID = process.env.DISCORD_CLIENT_ID as string;
        const GUILD_ID = process.env.DISCORD_GUILD_ID as string;

        const rest = new REST({ version: '10' }).setToken(TOKEN);  // Initialize REST client
        console.log('A: start registering commands');

        // Register commands with Discord
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),  // Specify the guild for registration
            { body: commands }  // Body of the request, containing the commands
        );
        
        console.log('B: successful register of commands');
    } catch (error) {
        console.error('B: failed register of commands', error);  // Handle errors during command registration
    }
}