import { Client, GatewayIntentBits, TextChannel, ChannelType, } from 'discord.js'
import cron from 'node-cron';
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { OUR_COMMANDS } from './commandList';
import { client } from './client';
import * as INDEX_HELPERS_2 from './index_helpers_2'
import * as HELPERS from '../utils/utils_structuring'
import { getMemberIdStringByUsername } from '../features/features_helpers';

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

        // Variables
        const guildMountId = process.env.DISCORD_GUILD_MOUNT_ID!;
        const guildMooseId = process.env.DISCORD_GUILD_MOOSE_ID!;


        /*// My Daily Reminder — at 7:00 AM EST every day
        const messageDuke = process.env.DAILY_DUKE!;
        cron.schedule('0 7 * * *', async () => {
            HELPERS.sendDailyMessage(guildMountId, "aaa", "duke", messageDuke, ['233713166096269313'], ['💪', '🍕', '📚', '💻', '😘'])
        }, {
            timezone: "America/New_York",
        });

        // Yan's Daily Reminder — at 7:00 AM EST every day
        const messageYan = "YOURE GONNA BE A FUCKING FAILURE AND WORK AT MCDONALDS IF YOU DONT STOP BEING LAZY AND APPLY";
        cron.schedule('0 7 * * *', async () => {
            HELPERS.sendDailyMessage(guildMountId, "aaa", "yan", messageYan, ['381175099522285569'], []);
        }, {
            timezone: "America/New_York",
        });*/

        const guildMount = client.guilds.cache.get(guildMountId);
        const channel = await INDEX_HELPERS_2.returnChannelByGuild(guildMount!, 'aaa');
        cron.schedule('0 7 * * *', async () => {
            HELPERS.sendDailyWord(channel, ['233713166096269313','381175099522285569']);
        }, {
            timezone: "America/New_York",
        });
        

        // Jul
        const messageJul = process.env.DAILY_JUL!;
        cron.schedule('0 21 * * *', async () => {
            HELPERS.sendDailyMessage(guildMooseId, "general", "jul", messageJul, ['1217389889260224532'], []);
        }, {
            timezone: "America/New_York",
        });


        // Log
        console.log('(5/6) SCHEDULE RECURRING TASKS: SUCCESS');
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(5/6) SCHEDULE RECURRING TASKS: FAIL", error.stack || String(error))
    }

}


