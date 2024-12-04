import {ChannelType, TextChannel,PresenceStatus, CommandInteraction, Collection, GuildMember} from 'discord.js';
import {client, tracker, startBot} from './src/setup';
import * as FUNCTIONS_MSG from './src/features_msg';
import * as FUNCTIONS_BOT from './src/features_bot';
import * as HELPERFUNCTIONS from './src/helperFunctionts';
import config from './src/config'
import 'dotenv/config';


client.once('ready', async () => {
    try {
        // Iterate through all guilds (servers) the bot is a part of using a for loop
        for (const guild of client.guilds.cache.values()) {
            console.log(`(2) SERVER CONNECTION: SUCCESS - ${guild.name} (${guild.id})`);

            // Initialize a map for this server if it doesn't already exist
            tracker.set(guild.id, new Map());

            // Put itself in tracker (example for the bot itself)
            const currentTime = new Date().toISOString();
            tracker.get(guild.id)?.set('BOT', currentTime);  // 'BOT' tracks the bot's status per server

            // Get all members of the guild
            const members = await guild.members.fetch();
            let correctMembers:Collection<string,GuildMember>;
            // if it's that server ...
            if (guild.id===process.env.DISCORD_GUILD_ID){
                correctMembers = members.filter((member) =>
                    member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)) // Check for required roles
                );
            }
            else {
                correctMembers=members;
            }


            // Replace `forEach` with a standard for loop
            for (const [_, member] of correctMembers) {
                // Check if member.presence exists before accessing properties
                if (!member.presence) {
                    // If the member is offline
                    const tracker_id = HELPERFUNCTIONS.getNicknameOrUsernameElseNull(member.guild, member.user.username) as string;
                    const currentTime = new Date().toISOString();
                    tracker.get(guild.id)?.set(tracker_id, currentTime);
                    console.log(`${tracker_id} is offline and has been added to the tracker for ${guild.name}.`);
                } else {
                    // If the member is online
                    const tracker_id = HELPERFUNCTIONS.getNicknameOrUsernameElseNull(member.guild, member.user.username) as string;
                    tracker.get(guild.id)?.set(tracker_id, null);
                    console.log(`${tracker_id} is online and has been added to the tracker for ${guild.name}.`);
                }
            }

            // Find the first text channel in the specific server
            const channel = guild.channels.cache.find(
                (channel): channel is TextChannel =>
                    channel.type === ChannelType.GuildText
            );
            if (channel) {
                console.log(`(3) CHANNEL CONNECTION: SUCCESS for ${guild.name}`);
            } else {
                console.log(`(3) No channel found to send initial message for ${guild.name}`);
            }
        }
    } catch (error) {
        console.error(`READY: ${error}`);
    }
});


// A Map that stores deletion timers for each server, which maps the user ID (tracker_id) to a NodeJS.Timeout
const deletion_timers: Map<string, Map<string, NodeJS.Timeout>> = new Map();

// A Map that stores addition timers for each server, which maps the user ID (tracker_id) to a NodeJS.Timeout
const addition_timers: Map<string, Map<string, NodeJS.Timeout>> = new Map();
client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.user || !newPresence.guild) {
        console.log("No presence update detected or missing guild/user information.");
        return;
    }

    // Type guard for type narrowing
    const isOfflineStatus = (s: string): s is 'offline' => s === 'offline';

    // Variables
    const username = newPresence.user.username;
    const tracker_id = HELPERFUNCTIONS.getNicknameOrUsernameElseNull(newPresence.guild, username) as string;
    const status = newPresence.status;
    const member = newPresence.guild?.members.cache.get(newPresence.user.id);

    // Skip if member is not found
    if (!member) {
        return;
    }

    // Check roles based on server ID
    if (newPresence.guild.id === process.env.DISCORD_GUILD_ID) {
        // If the server ID matches, check for required roles
        if (!member.roles.cache.some(role => config.mis.requiredRoles.includes(role.name))) {
            return;
        }
    }

    // Ensure there is a map for the server already initialized in the ready event
    const guildDeletionTimers = deletion_timers.get(newPresence.guild.id);
    const guildAdditionTimers = addition_timers.get(newPresence.guild.id);

    if (isOfflineStatus(status)) {
        const currentTime = new Date().toISOString();

        // Check if entry exists in tracker and handle updating the time
        const serverTracker = tracker.get(newPresence.guild.id);
        if (serverTracker?.get(tracker_id) !== null) {
            const oldTime = serverTracker!.get(tracker_id)!;
            const old_date = new Date(oldTime);
            const new_date = new Date(currentTime);
            const time_diff = new_date.getTime() - old_date.getTime();

            // If the difference is over an hour, keep the old one. Otherwise, update to the newest time
            if (time_diff > config.times.SLEEPCHECK_CHECK_PERIOD) {
                return;
            } else {
                serverTracker!.set(tracker_id, currentTime);
            }
        } else {
            // If no time is set (entry is null), set the current time
            serverTracker?.set(tracker_id, currentTime);
        }

        // Handle case if we had a pending addition timer and the member goes offline
        if (guildAdditionTimers?.has(tracker_id)) {
            clearTimeout(guildAdditionTimers.get(tracker_id)!); // Safely clear the timeout
        }

        // Set a new timeout to ensure tracker gets updated after the specified period
        const timeout = setTimeout(() => {
            if (serverTracker?.get(tracker_id) !== null) return;
            serverTracker?.set(tracker_id, currentTime);
            guildAdditionTimers?.delete(tracker_id); // Delete after timeout
        }, config.times.SLEEPCHECK_CHECK_PERIOD);

        guildAdditionTimers?.set(tracker_id, timeout);

        console.log(`${tracker_id} has gone offline at ${currentTime}`);
    } else if (!isOfflineStatus(status) && tracker.get(newPresence.guild.id)?.get(tracker_id)) {
        // If the member comes online and hasn't already been processed
        if (guildDeletionTimers?.has(tracker_id)) {
            return;
        }

        // Set a timeout to mark them as null when they come online
        const timeout = setTimeout(() => {
            const serverTracker = tracker.get(newPresence.guild!.id);
            serverTracker?.set(tracker_id, null); // Set to null
            guildDeletionTimers?.delete(tracker_id); // Delete after timeout
        }, config.times.SLEEPCHECK_CHECK_PERIOD);

        guildDeletionTimers?.set(tracker_id, timeout);

        console.log(`${tracker_id} is now online.`);
    }
});



import {EmbedBuilder} from 'discord.js';

client.on('messageCreate', async (message) => {
    try {
        if (message.author.bot) return;

        // !test (case-insensitive)
        if (message.content.toUpperCase() === '!TEST') {
            message.channel.send("TEST==TRUE");
        }

        // !sleep <@xyz> (case-insensitive)
        else if (message.content.toUpperCase().startsWith('!SLEEP')) {
            //FUNCTIONS_MSG.handleSleepCommand(message, tracker);
        }

        // !features (case-insensitive)
        else if (message.content.toUpperCase() === '!FEATURES') {
            FUNCTIONS_MSG.handleFeaturesCommand(message);
        }

        // !arena (case-insensitive)
        else if (message.content.toUpperCase().startsWith('!ARENA')) {
            FUNCTIONS_MSG.handleArenaCommand(message);
        }

        // !joinvc (case-insensitive)
        else if (message.content.toUpperCase() === '!JOINVC') {
            FUNCTIONS_MSG.handleJoinVCCommand(message);
        }

        // !xyz (case-insensitive) with mention
        else if (message.content.toUpperCase().startsWith('!XYZ')) {
            const mentionedUser = message.mentions.users.first();
            
            if (!mentionedUser) {
                return message.channel.send('Please mention a user to impersonate!');
            }

            // Create the impersonation embed
            const impersonateEmbed = new EmbedBuilder()
                .setAuthor({
                    name: `${mentionedUser.username}#${mentionedUser.discriminator}`,
                    iconURL: mentionedUser.displayAvatarURL()
                })
                .setDescription('you give me c')
                .setColor('#3498db')  // You can choose any color you like
                .setTimestamp();

            // Send the impersonation message
            message.channel.send({ embeds: [impersonateEmbed] });
        }

        // !attack (case-insensitive)
        else if (message.content.toUpperCase().startsWith('!ATTACK')) {
            FUNCTIONS_MSG.handleAttackCommand(message);
        }

        // !flip (case-insensitive)
        else if (message.content.toUpperCase() === '!FLIP') {
            FUNCTIONS_MSG.handleCoinFlipCommand(message);
        }

        // !hangman (case-insensitive)
        else if (message.content.toUpperCase() === '!HANGMAN') {
            FUNCTIONS_MSG.handleHangman(message);
        } 

        // Simulate an error with !error
        else if (message.content.toUpperCase().startsWith('!ERROR')) {
            throw new Error("Simulated error");
        }

        // unknown input
        else if (message.content.startsWith('!')) {
            HELPERFUNCTIONS.sendEmbed((message.channel as TextChannel), null, "??", `Unknown input: ${message.content}`);
        }
    } catch (error) {
        console.error('An error occurred:', error);
        (message.channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS.sendEmbed(message.channel as TextChannel, './static/dead_discord.GIF', "You fucked me", "Uhhhh I got to go. I'll be back soon!");
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isCommand()) return; // commands only
        const { commandName } = interaction;

        // arguments
        const commandInteraction = (interaction as CommandInteraction);
        const normalizedCommandName = commandName.toUpperCase();
        const channel = (commandInteraction.channel as TextChannel);

        // hang
        if (normalizedCommandName === 'TEST') {
            await FUNCTIONS_BOT.testFunction(commandInteraction);
        }
        // flip
        else if (normalizedCommandName === 'REPLY') {
            await HELPERFUNCTIONS.interactionReply(commandInteraction, './static/Zhu.webp', 'Attack Result', 'Bang! <@target> gets hit!');
        }
        // coinflip
        else if (normalizedCommandName === 'COINFLIP') {
            await FUNCTIONS_BOT.handleCoinFlipInteraction(commandInteraction);
        }
        // hangman
        else if (normalizedCommandName === 'HANGMAN') {
            await FUNCTIONS_BOT.handleHangmanInteraction(commandInteraction, channel);
        }
        else if (normalizedCommandName === 'ATTACK') {
            await FUNCTIONS_BOT.handleAttackInteraction(commandInteraction);
        }
        else if (normalizedCommandName === 'SLEEP'){
            await FUNCTIONS_BOT.handleSleepInteraction(commandInteraction);
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
    }
});


// network issue
client.on('disconnect', async () => {
    console.log('Bot disconnected from Discord.');

    // Send a message to a specific channel about the disconnection
    const channel = client.channels.cache.get(config.ids.BIGBROTHER);  // Replace with your actual channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        await HELPERFUNCTIONS.sendEmbed(channel as TextChannel, null, "...", "Uhhhh I got to go. I'll be back soon!");
    }
});

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the error
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        HELPERFUNCTIONS.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the rejection
});


// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(HELPERFUNCTIONS.kill_week_old_entries, 24 * 60 * 60 * 1000); 

setInterval(HELPERFUNCTIONS.sendReminder, Math.floor((Math.random()*12)) * 60 * 60 * 1000);



