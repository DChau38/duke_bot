import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType, TextChannel } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.once('ready', () => {
    console.log("Bot is online!");
   
    // Find the first text channel in a specific server
    const channel = client.channels.cache.find(
        (channel): channel is TextChannel =>
            channel.type === ChannelType.GuildText &&
            channel.guildId === process.env.SERVER_ID
    );
 
    if (channel) {
        channel.send('(2/2) CHANNEL CONNECTION: SUCCESS');
    } else {
        console.log("(2/2) No channel found to send initial message");
    }
});


// Async function for login with error handling
async function startBot() {
    try {
        if (!process.env.BOT_TOKEN) {
            throw new Error('Bot token is not defined in environment variables');
        }
        
        await client.login(process.env.BOT_TOKEN);
        console.log(' (1/2) LOGIN: SUCCESS');
    } catch (error) {
        console.error('(1/2) LOGIN: FAIL-', error);
        process.exit(1);
    }
}

// Call the async function to start the bot
startBot();