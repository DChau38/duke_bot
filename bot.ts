import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType, TextChannel } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences,
    ]
});

client.once('ready', async () => {
    // Check if the bot can access the server (guild)
    try {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string);
        console.log(`(2) SERVER CONNECTION: SUCCESS - ${guild.name} (${guild.id})`);

        // Find the first text channel in the specific server
        const channel = guild.channels.cache.find(
            (channel): channel is TextChannel =>
                channel.type === ChannelType.GuildText
        );

        if (channel) {
            console.log("(3) CHANNEL CONNECTION: SUCCESS");
            channel.send('(3) CHANNEL CONNECTION: SUCCESS');
        } else {
            console.log("(3) No channel found to send initial message");
        }
    } catch (error) {
        console.error(`READY: ${error}`);
    }
});


client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.user) return;

    const userId = newPresence.user.id;
    const status = newPresence.status;

    if (status === 'offline') {
        // Get the current time in a human-readable format
        const currentTime = new Date().toLocaleString(); // More readable format

        // Log the message with a clear, human-readable output
        console.log(`${newPresence.user.username} has gone offline at ${currentTime}.`);
    }
});



// Async function for login with error handling
async function startBot() {
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

// Call the async function to start the bot
startBot();