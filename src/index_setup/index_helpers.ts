import { Client, GatewayIntentBits, TextChannel, ChannelType, } from 'discord.js'
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
import { OUR_COMMANDS } from './commandList';
import { client } from './client';
import * as INDEX_HELPERS_2 from './index_helpers_2'
import * as HELPERS from '../utils/utils_structuring'
import { getMemberIdByUsername } from '../features/features_helpers';

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

        // My Daily Reminder
        const intervalOf24Hrs = 24 * 60 * 60 * 1000;
        const messageDuke = "<inspirationalQuote"
        const setDukeReminder = async () => {
            await setReminderInBotChannel("duke", messageDuke, intervalOf24Hrs);
        }
        setDukeReminder();
        setInterval(setDukeReminder, intervalOf24Hrs);

        // Yan's daily reminder
        const messageYan = "did you apply yet you bonobo"
        const setYanReminder = async () => {
            await setReminderInBotChannel("yan240", messageYan, intervalOf24Hrs);
        }
        setYanReminder();
        setInterval(setYanReminder, intervalOf24Hrs);


        // Log
        console.log('(5/6) SCHEDULE RECURRING TASKS: SUCCESS');
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await HELPERS.centralErrorHandler(atUser, "(5/6) SCHEDULE RECURRING TASKS: FAIL", error.stack || String(error))
    }
    // setReminderInBotChannel(username, message, time) => sets a reminder in the bot channel
    async function setReminderInBotChannel(username: string, message: string, time: number) {
        try {
            // Step 1: Get variables (guild, botChannel, userId)
            const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID as string);
            if (!guild) {
                throw new Error("Main Guild Not Found");
            }
            const botChannel = await INDEX_HELPERS_2.returnBotLogChannel(guild);
            const userId = getMemberIdByUsername(guild, username);
            const userIds = [userId];

            // Step 2: Set Reminder
            setReminder(botChannel, userIds, message, time);
        } catch (error) {
            const atUser = process.env.DISCORD_ACCOUNT_ID!;
            await HELPERS.centralErrorHandler(atUser, "setMyScheduledReminder()", error.stack || String(error));

        }
    }
    // setReminder(guild, userIds, message, time) => sets a reminder
    async function setReminder(channel: TextChannel, userIds: number[], message: string, time: number): Promise<void> {
        try {
            // Step 2: Set timeout for sending reminder
            setTimeout(async () => {
                try {
                    // Ping users
                    if (userIds.length > 0) {
                        const mentions = userIds.map(id => `<@${id}>`).join(' ');
                        await channel.send(`${mentions}`);
                    }
                    // Send Reminder Embed
                    await HELPERS.sendEmbed(channel, null, '⏰ Reminder', message);
                } catch (error) {
                    const atUser = process.env.DISCORD_ACCOUNT_ID!;
                    await HELPERS.centralErrorHandler(atUser, "reminderFunction()", error.stack || String(error));
                }
            }, time);

        } catch (error) {
            const atUser = process.env.DISCORD_ACCOUNT_ID!;
            await HELPERS.centralErrorHandler(atUser, "reminderFunction()", error.stack || String(error));
        }
    }

}
