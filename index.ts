import { ChannelType, TextChannel, PresenceStatus, CommandInteraction, Collection, GuildMember } from 'discord.js';
import * as BOT_FUNCTIONS from './src/features/features_bot';
import * as HELPERS from './src/features/features_helpers';
import * as UTILS from './src/features/features_utils';
import config from './src/config/config'
import 'dotenv/config';
import * as INDEX_HELPERS from './src/index_setup/index_helpers'
import { client } from './src/index_setup/client';
import { centralErrorHandler, sendEmbed } from './src/utils/utils_structuring';
import { getTextChannel } from './src/index_setup/index_helpers_2';

// Place before initializeBot() to handle early setup or loading dependencies as well
process.on('uncaughtException', async (error) => {
    const atUser = process.env.DISCORD_ACCOUNT_ID!
    await centralErrorHandler(atUser, "UNCAUGHT ERROR", error.stack || String(error))

});
initializeBot();


async function initializeBot() {
    try {
        // Step 1: Error handling
        INDEX_HELPERS.handleInitializationErrors();
        // Step 2: Attach event handlers
        await INDEX_HELPERS.attachEventHandlers()
        // Step 3: Login to Discord
        await INDEX_HELPERS.loginToDiscord();
        // Step 4: Register slash commands
        await INDEX_HELPERS.registerSlashCommands();
        // Step 5: Schedule recurring tasks
        await INDEX_HELPERS.scheduleRecurringTasks();
        console.log('(6/6) BOT INTITIALIZATION: SUCCESS');

        const botChannel = await getTextChannel(client, process.env.DISCORD_GUILD_ID!, process.env.BOT_LOG_CHANNEL!);
        const initializeUrlToImage = 'static/anime/animeGirl_heatUp.gif'
        const now = new Date();
        const formatted = now.toLocaleString();
        sendEmbed(botChannel!, initializeUrlToImage, '✨ Bot Initialized✨ ', formatted);
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "(6/6) BOT INTITIALIZATION: FAILED", error.stack || String(error))
    }
}

