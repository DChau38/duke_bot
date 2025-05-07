import { Client, GatewayIntentBits, TextChannel, ChannelType, } from 'discord.js'
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { OUR_COMMANDS } from './commandList';
import { client } from './client';
import * as INDEX_HELPERS_2 from './index_helpers_2'

export function handleInitializationErrors() {
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
        console.error("(1/6) HANDLE ERRORS: FAILED")

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
        console.error('(3/6) LOGIN: FAIL', error);
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
        console.error('(4/6) REGISTER COMMANDS: FAILURE', error);
    }
}
export async function attachEventHandlers() {
    try {
        client.on('ready', () => INDEX_HELPERS_2.handleTrackerInitialization());
        client.on('presenceUpdate',  (oldPresence, newPresence) => INDEX_HELPERS_2.handlePresenceUpdate(oldPresence, newPresence));
        client.on('interactionCreate', (interaction) => INDEX_HELPERS_2.handleInteraction(interaction));
        client.on('disconnect', () => INDEX_HELPERS_2.handleDisconnect());
        console.log('(2/6) ATTACH EVENT HANDLERS: SUCCESS');
    } catch (error) {
        console.error('(2/6) ATTACH EVENT HANDLERS: FAIL');
    }

}
export async function scheduleRecurringTasks() {
    try {

        console.log('(5/6) SCHEDULE RECURRING TASKS: SUCCESS');
    } catch (error) {
        console.error('(5/6) SCHEDULE RECURRING TASKS: FAIL');
    }
}
