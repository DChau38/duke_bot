import { ChannelType, TextChannel, PresenceStatus, CommandInteraction, Collection, GuildMember } from 'discord.js';
import * as BOT_FUNCTIONS from './src/features/features_bot';
import * as HELPERS from './src/features/features_helpers';
import * as UTILS from './src/features/features_utils';
import config from './src/config/config'
import 'dotenv/config';
import * as INDEX_HELPERS from './src/index_setup/index_helpers'
import { client } from './src/index_setup/client';

// Place before initializeBot() to handle early setup or loading dependencies as well
process.on('uncaughtException', async (error) => {
    // Step 1: Print to stderr
    console.error('UNCAUGHT ERROR:', error);

    // Step 2: Send to log channel if it is defined
    const channel = client.channels.cache.get(config.ids.BOT_LOG_CHANNEL);
    if (channel) {
        await (channel as TextChannel).send(`<@${process.env.DISCORD_ACCOUNT_ID}>`);
        await UTILS.sendEmbed(channel as TextChannel, null, "UNCAUGHT ERROR", `${error.stack}`);
    }

});
initializeBot();


async function initializeBot() {
    try {
        // Step 1: Error handling
        INDEX_HELPERS.handleInitializationErrors();

        // Step 2: Login to Discord
        await INDEX_HELPERS.loginToDiscord();

        // Step 3: Register slash commands
        await INDEX_HELPERS.registerSlashCommands();

        // Step 4: Attach event handlesr
        await INDEX_HELPERS.attachEventHandlers()
        // Step 5: Schedule recurring tasks
        await INDEX_HELPERS.scheduleRecurringTasks();
        console.log('(4/4) BOT INTITIALIZATION: SUCCESS');
    } catch (error) {
        console.error('(4/4) BOT INTITIALIZATION: FAILED', error);
    }
}

