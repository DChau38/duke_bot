import { Client, GatewayIntentBits, TextChannel, ChannelType, } from 'discord.js'
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { OUR_COMMANDS } from './commandList';
import { client } from './client';
import * as INDEX_HELPERS_2 from './index_helpers_2'
import * as HELPERS from '../utils/utils_structuring'

export async function handleInitializationErrors() {
    try {
        // Step 1: Get variables
        const missingVars: string[] = [];
        const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
        const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

        // Step 2: Push missing variables
        if (!DISCORD_BOT_TOKEN) missingVars.push('DISCORD_BOT_TOKEN');
        if (!DISCORD_CLIENT_ID) missingVars.push('DISCORD_CLIENT_ID');

        // Step 3: Print missing variables
        if (missingVars.length > 0) {
            console.error('❌ Initialization failed due to missing environment variables:');
            for (const variable of missingVars) {
                console.error(` - ${variable}`);
            }
            process.exit(1);
        }
        console.log("(1/6) HANDLE ERRORS: SUCCESS")
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(6/6) BOT INTITIALIZATION: FAILED", error.stack || String(error))

    }
}
export async function loginToDiscord() {
    try {
        // Step 1: Get Variables
        const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string

        // Step 2: Login to Discord
        await client.login(process.env.DISCORD_BOT_TOKEN);
        console.log('(3/6) LOGIN: SUCCESS');
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(3/6) LOGIN: FAIL", error.stack || String(error))
    }
}
export async function registerSlashCommands() {
    try {
        // Step 1: Get Variables
        const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN as string;
        const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID as string

        // Step 2: Register commands
        const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN); // Initialize REST client
        await rest.put(
            Routes.applicationCommands(DISCORD_CLIENT_ID),  // This registers the commands globally
            { body: OUR_COMMANDS }
        );


        console.log('(4/6) REGISTER COMMANDS: SUCCESS');
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(4/6) REGISTER COMMANDS: FAILURE", error.stack || String(error))
    }
}
export async function attachEventHandlers() {
    try {
        client.on('ready', () => INDEX_HELPERS_2.handleTrackerInitialization());
        client.on('presenceUpdate', (oldPresence, newPresence) => INDEX_HELPERS_2.handlePresenceUpdate(oldPresence, newPresence));
        client.on('interactionCreate', (interaction) => INDEX_HELPERS_2.handleInteraction(interaction));
        client.on('disconnect', () => INDEX_HELPERS_2.handleDisconnect());
        console.log('(2/6) ATTACH EVENT HANDLERS: SUCCESS');
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(2/6) ATTACH EVENT HANDLERS: FAIL", error.stack || String(error))
    }

}
export async function scheduleRecurringTasks() {
    try {

        console.log('(5/6) SCHEDULE RECURRING TASKS: SUCCESS');
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(5/6) SCHEDULE RECURRING TASKS: FAIL", error.stack || String(error))
    }
    async function killWeekOldEntries() {
        try {
            const oneWeek = 7 * 24 * 60 * 60 * 1000;  // One week in milliseconds

            // Loop through each userIdentifier and their last offline timestamp
            for (const [userIdentifier, lastOfflineTime] of Object.entries(INDEX_HELPERS_2.tracker)) {
                // Skip users who are currently online (whose value is null)
                if (lastOfflineTime === null) {
                    continue;
                }

                // Convert the last offline timestamp (string) into a Date object
                const offlineTime = new Date(lastOfflineTime);
                const timeDiff = new Date().getTime() - offlineTime.getTime();

                // If the user has been offline for more than a week, remove them from the tracker
                if (timeDiff > oneWeek) {
                    INDEX_HELPERS_2.tracker[userIdentifier] = null;
                    console.log(`${userIdentifier} has been removed from the tracker as they were offline for over a week.`);
                }
            }
        } catch (error) {
            const atUser = process.env.DISCORD_ACCOUNT_ID!
            await HELPERS.centralErrorHandler(atUser, "killWeekOldEntries()", error.stack || String(error))
        }

    }
    const reminder_yan = async () => {
        try {
            const guild = client.guilds.cache.get(process.env.SERVER_ID as string);
            if (guild) {
                const channel = guild.channels.cache.find(
                    (ch) => ch.type === ChannelType.GuildText && ch.name === 'config.ids.BOT_LOG_CHANNEL'
                ) as TextChannel;

                if (channel) {
                    const member = guild.members.cache.find((mem) => mem.user.username === 'yan240')
                    await channel.send(`<@${member?.user.id}> Reminder to do one's racket :)`);
                } else {
                    console.log("config.ids.BOT_LOG_CHANNEL channel not found");
                }
            }
        } catch (error) {
            const atUser = process.env.DISCORD_ACCOUNT_ID!
            await HELPERS.centralErrorHandler(atUser, "reminderYan()", error.stack || String(error))
        }
    };
    const reminderDuke = async () => {
        try {
            const guild = client.guilds.cache.get(process.env.SERVER_ID as string);
            if (guild) {
                const channel = guild.channels.cache.find(
                    (ch) => ch.type === ChannelType.GuildText && ch.name === 'config.ids.BOT_LOG_CHANNEL'
                ) as TextChannel;

                if (channel) {
                    const member = guild.members.cache.find((mem) => mem.user.username === 'duke9999')
                    await channel.send(`<@${member?.user.id}> It's time to take a break!`);
                } else {
                    console.log("config.ids.BOT_LOG_CHANNEL channel not found");
                }
            }
        } catch (error) {
            const atUser = process.env.DISCORD_ACCOUNT_ID!
            await HELPERS.centralErrorHandler(atUser, "reminderDuke()", error.stack || String(error))
        }
    };
}
