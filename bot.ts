import {ChannelType, TextChannel,PresenceStatus} from 'discord.js';
import {client, tracker, startBot, kill_week_old_entries, sendReminder} from './src/setup';
import {handleStatusCommand,handleFeaturesCommand, handleArenaCommand, handleJoinVCCommand} from './src/functions'
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

    const member = newPresence.guild?.members.cache.get(newPresence.user.id);
    const requiredRoles = ['nobles', 'mahjongers']; 

    if (!member || !member.roles.cache.some(role => requiredRoles.includes(role.name))) {
        // User does not have any of the required roles
        return;
    }

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

    // !test (case-insensitive)
    if (message.content.toLowerCase() === '!test') {
        message.channel.send("TEST==TRUE");
    }

    // !status <@xyz> (case-insensitive)
    if (message.content.toLowerCase().startsWith('!status')) {
        handleStatusCommand(message, tracker);
    }

    // !features (case-insensitive)
    if (message.content.toLowerCase() === '!features') {
        handleFeaturesCommand(message);
    }

    // !arena (case-insensitive)
    if (message.content.toLowerCase().startsWith('!arena')) {
        handleArenaCommand(message);
    }

    // !joinvc (case-insensitive)
    if (message.content.toLowerCase() === '!joinvc') {
        handleJoinVCCommand(message);
    }
});




// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(kill_week_old_entries, 24 * 60 * 60 * 1000); 

setInterval(sendReminder, Math.floor((Math.random()*12)) * 60 * 60 * 1000);

