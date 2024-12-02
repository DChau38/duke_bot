import {Client, GatewayIntentBits,TextChannel,ChannelType} from 'discord.js'
import {REST,Routes} from 'discord.js';
import 'dotenv/config';

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
        if (!process.env.BOT_TOKEN) {
            throw new Error('Bot token is not defined in environment variables');
        }
        
        await client.login(process.env.BOT_TOKEN);
        console.log('(1) LOGIN: SUCCESS');
    } catch (error) {
        console.error('(1) LOGIN: FAIL-', error);
    }
}


