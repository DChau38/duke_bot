import {ChannelType, TextChannel,PresenceStatus} from 'discord.js';
import {client, tracker, startBot, kill_week_old_entries, sendReminder} from './src/setup';
import {handleStatusCommand} from './src/functions'
import 'dotenv/config';

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
        handleStatusCommand(message,tracker);
    }
});




// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(kill_week_old_entries, 24 * 60 * 60 * 1000); 
setInterval(sendReminder, Math.floor((Math.random()*24) * 60 * 60 * 1000))

