import {ChannelType, TextChannel,PresenceStatus, CommandInteraction, Collection, GuildMember} from 'discord.js';
import {client, tracker, startBot, addition_timers, deletion_timers} from './src/setup';
import * as BOT_FUNCTIONS from './src/features_bot';
import * as HELPERS from './src/features_helpers';
import * as UTILS from './src/features_utils';
import config from './src/config'
import 'dotenv/config';


client.once('ready', async () => {
    try {
        // Iterate through all guilds (servers) the bot is a part of using a for loop
        for (const guild of client.guilds.cache.values()) {
            console.log(`(2) SERVER CONNECTION: SUCCESS - ${guild.name} (${guild.id})`);

            // set guilds for our maps
            tracker.set(guild.id, new Map());
            addition_timers.set(guild.id, new Map());
            deletion_timers.set(guild.id,new Map());

            // Put itself in tracker (example for the bot itself)
            const currentTime = new Date().toISOString();
            tracker.get(guild.id)!.set('BOT', currentTime);  // 'BOT' tracks the bot's status per server

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
                    const tracker_id = UTILS.getNicknameOrUsernameElseNull(member.guild, member.user.username) as string;
                    const currentTime = new Date().toISOString();
                    tracker.get(guild.id)!.set(tracker_id, currentTime);
                } else {
                    // If the member is online
                    const tracker_id = UTILS.getNicknameOrUsernameElseNull(member.guild, member.user.username) as string;
                    tracker.get(guild.id)!.set(tracker_id, null);
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



client.on('presenceUpdate', async (oldPresence, newPresence) => {
    if (!newPresence || !newPresence.user || !newPresence.guild) {
        console.log("No presence update detected or missing guild/user information.");
        return;
    }

    // Type guard for type narrowing
    const isOfflineStatus = (s: string): s is 'offline' => s === 'offline';

    // Variables
    const username = newPresence.user.username;
    const tracker_id = UTILS.getNicknameOrUsernameElseNull(newPresence.guild, username) as string;
    const status = newPresence.status;
    const member = newPresence.guild!.members.cache.get(newPresence.user.id);

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


    // handles delayed deletions of tracker entries (so that they can continue to view after getting online)
    // handles delayed additions to tracker entries (so that we can fix delayed deletion after they get off but the delay doesn't complete till after)
    const guildDeletionTimers = deletion_timers.get(newPresence.guild.id);
    const guildAdditionTimers = addition_timers.get(newPresence.guild.id);

    // When: they go offline
    if (isOfflineStatus(status)) {
        const currentTime = new Date().toISOString();

        // case: if they have a valid time entry already (non-null)
        const serverTracker = tracker.get(newPresence.guild.id);
        if (serverTracker!.get(tracker_id) !== null) {
            const oldTime = serverTracker!.get(tracker_id)!;
            const old_date = new Date(oldTime);
            const new_date = new Date(currentTime);
            const time_diff = new_date.getTime() - old_date.getTime();

            // (given new vs old offline_entries, which one should be kept?)
            // If the difference is over an hour, keep the old one. Otherwise, update to the newest time
            // This allows us to keep viewing the "real" entry if they keep switching between on and off 
            if (time_diff > config.times.SLEEPCHECK_CHECK_PERIOD) {
                return;
            } else {
                serverTracker!.set(tracker_id, currentTime);
            }
        } else {
            // case: if they just got offline for the first time, add the entry
            serverTracker!.set(tracker_id, currentTime);
        }

        // (below adds another delayed addition) - if there is a pre-existing one, then the pre-existing one is obselete (not as updated)
        if (guildAdditionTimers!.has(tracker_id)) {
            clearTimeout(guildAdditionTimers!.get(tracker_id)!); 
        }

        // (accounts for case on-off, where the delay for deleting the entry completes after they get off)
        // add a delayed function that re-adds the entry if it's been deleted. But if there is an entry there already just return
        const timeout = setTimeout(() => {
            if (serverTracker!.get(tracker_id) !== null) return;
            serverTracker!.set(tracker_id, currentTime);
            guildAdditionTimers!.delete(tracker_id); 
        }, config.times.SLEEPCHECK_CHECK_PERIOD);
        guildAdditionTimers!.set(tracker_id, timeout);
        console.log(`${tracker_id} has gone offline at ${currentTime}`);
    } else if (!isOfflineStatus(status) && tracker.get(newPresence.guild.id)!.get(tracker_id)) {

        // (below adds another delayed deletion) - if there is a pre-existing one, then the previous one should be kept
        // This prevents them from swapping between on-off to never delete any entries
        if (guildDeletionTimers!.has(tracker_id)) {
            return;
        }

        // adds delayed function to delete offline_entry (so they have time to view it)
        const timeout = setTimeout(() => {
            const serverTracker = tracker.get(newPresence.guild!.id);
            serverTracker!.set(tracker_id, null); // Set to null
            guildDeletionTimers!.delete(tracker_id); // Delete after timeout
        }, config.times.SLEEPCHECK_CHECK_PERIOD);
        guildDeletionTimers!.set(tracker_id, timeout);
        console.log(`${tracker_id} is now online.`);
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
            await BOT_FUNCTIONS.testFunction(commandInteraction);
        }
        // flip
        else if (normalizedCommandName === 'REPLY') {
            await UTILS.interactionReply(commandInteraction,true,'./static/Zhu.webp', 'Attack Result', 'Bang! <@target> gets hit!');
        }
        // coinflip
        else if (normalizedCommandName === 'COINFLIP') {
            await BOT_FUNCTIONS.handleCoinFlipInteraction(commandInteraction);
        }
        // hangman
        else if (normalizedCommandName === 'HANGMAN') {
            await BOT_FUNCTIONS.handleHangmanInteraction(commandInteraction, channel);
        } // attack
        else if (normalizedCommandName === 'ATTACK') {
            await BOT_FUNCTIONS.handleAttackInteraction(commandInteraction);
        } // sleep
        else if (normalizedCommandName === 'SLEEP'){
            await BOT_FUNCTIONS.handleSleepInteraction(commandInteraction);
        }
        else if (normalizedCommandName === 'ARENA'){
            await BOT_FUNCTIONS.handleArenaInteraction(commandInteraction);
        }
        else if (normalizedCommandName === 'JOINVC'){
            await BOT_FUNCTIONS.handleJoinVCInteraction(commandInteraction);
        }
        else if (normalizedCommandName === 'TIMER'){
            await BOT_FUNCTIONS.handleTimerInteraction(commandInteraction);
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
        await UTILS.sendEmbed(channel as TextChannel, null, "...", "Uhhhh I got to go. I'll be back soon!");
    }
});

// Global error handling for uncaught exceptions
process.on('uncaughtException', async (error) => {
    // stderr - error
    console.error('UNCAUGHT ERROR:', error);

    // AAA - error
    const channel = client.channels.cache.get(config.ids.AAA); 
    if (channel) {
        // tag
        await (channel as TextChannel).send(`<@${process.env.DISCORD_ACCOUNT_ID}>`)
        // error stack message
        await UTILS.sendEmbed(channel as TextChannel, null, "Uncaught error", `${error.stack}`);
    }

    // kill process after 10s
    process.exit(1);  
});

// Global error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);

    const channel = client.channels.cache.get(config.ids.BIGBROTHER); // Replace with your channel ID
    if (channel) {
        (channel as TextChannel).send(`Halp me <@${process.env.ACCOUNT_ID}>`)
        UTILS.sendEmbed(channel as TextChannel, null, "...", "Something went wrong! I'll be back soon.");
    }

    process.exit(1);  // Optional: terminate the bot after handling the rejection
});


// Call the async function to start the bot
startBot();

// if they are offline for one week, delete thme
setInterval(UTILS.kill_week_old_entries, 24 * 60 * 60 * 1000); 

setInterval(UTILS.reminder_yan, Math.floor((Math.random()*12)) * 60 * 60 * 1000);
setInterval(UTILS.reminder_duke, 1 * 60 * 60 * 1000);




