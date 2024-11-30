import 'dotenv/config';
import { Client, GatewayIntentBits, ChannelType, TextChannel,PresenceStatus } from 'discord.js';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildPresences,
    ]
});

const tracker:{[userId:string]:string}={};

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
        } else {
            console.log("(3) No channel found to send initial message");
        }
    } catch (error) {
        console.error(`READY: ${error}`);
    }
});

client.on('presenceUpdate', (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.user) {
        console.log("No presence update detected.");
        return;
    }

    const username = newPresence.user.username;
    const status = newPresence.status;

    const isOfflineStatus = (s: string): s is 'offline' => s === 'offline';

    if (isOfflineStatus(status)) {
        const currentTime = new Date().toISOString();
        tracker[username] = currentTime;
        console.log(`${newPresence.user.username} has gone offline at ${currentTime}`);
    } else if (!isOfflineStatus(status) && tracker[username]) {
        delete tracker[username];
    }
});




client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Test case
    if (message.content === '!test') {
        message.channel.send("TEST");
    }

    // Time tracker case
    if (message.content.startsWith('!status')) {
        const args = message.content.split(' ');
        const username = args[1];

        if (!username) {
            message.channel.send("Please add a username!");
            return;
        }

        // If the user is in the tracker (i.e., offline)
        if (username in tracker) {
            const OFFLINE_TIME = new Date(tracker[username]);
            const CURRENT_TIME = new Date();
            const TIME_DIFF = CURRENT_TIME.getTime() - OFFLINE_TIME.getTime();

            // Format and send the offline time
            const days = Math.floor(TIME_DIFF / (1000 * 60 * 60 * 24));
            const hours = Math.floor((TIME_DIFF % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((TIME_DIFF % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((TIME_DIFF % (1000 * 60)) / 1000);
            const milliseconds = TIME_DIFF % 1000;

            message.channel.send(`${username} has been offline for ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds, and ${milliseconds} milliseconds.`);
        } else {
            // Check if the user is currently online (presence)
            const guild = message.guild;
            if (!guild) {
                message.channel.send("Could not find the server.");
                return;
            }

            const member = guild.members.cache.find((member) => member.user.username === username);

            if (!member) {
                message.channel.send(`${username} not found in the server.`);
                return;
            }

            const presence = member.presence;
            if (presence && presence.status !== 'offline') {
                message.channel.send(`${username} is online!`);
            } else {
                message.channel.send(`${username} is not in the database and also not currently online.`);
            }
        }
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

// if they are offline for one week, delete thme
setInterval(() => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000; 
    for (const userId in tracker) {
        const offlineTime = new Date(tracker[userId]);
        const timeDiff = new Date().getTime() - offlineTime.getTime();
        if (timeDiff > oneWeek) {
            delete tracker[userId];
        }
    }
}, 24 * 60 * 60 * 1000); // Run daily
