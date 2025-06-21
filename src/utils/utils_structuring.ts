import { AttachmentBuilder, CommandInteraction, EmbedBuilder, Message, TextChannel } from "discord.js";
import config from "../config/config";
import { client } from "../index_setup/client";
import { returnChannelByGuild } from "../index_setup/index_helpers_2";
import { getMemberIdStringByUsername } from "../features/features_helpers";
import { wordPool } from "../index_setup/globalData";

export async function centralErrorHandler(accountId: string, title: string, error: string) {
    try {
        // Step 1: Find Bot Log Channel
        const channel = client.channels.cache.get(config.ids.BOT_LOG_CHANNEL);
        if (!channel) {
            console.error(`<centralErrorHandler> BOT_LOG_CHANNEL: (${config.ids.BOT_LOG_CHANNEL}) not found.`);
            return;
        }

        // Step 2: Send messages
        console.error(title, error);
        await (channel as TextChannel).send(`<@${accountId}>`);
        await sendEmbed(channel as TextChannel, null, title, error);
    } catch (error) {
        // Part of error logging
        console.error("centralErrorHandler()", error.stack);
    }
}

export const sendEmbed = async (channel: TextChannel, urlToImage: string | null, title: string, description: string): Promise<Message> => {
    try {
        // Step 1: Make embed
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(title)
            .setDescription(description);

        // urlToImage is from working directory (root directory where index.ts is)
        // example: ('./static/flip/heads.JPG')
        if (urlToImage) {
            // Use regular expression to find the part after the last slash
            const fileName = urlToImage.match(/[^/]+$/)?.[0]; // This will capture everything after the last slash
            const attachment = new AttachmentBuilder(urlToImage);
            embed.setImage('attachment://' + fileName);
            return await channel.send({ embeds: [embed], files: [attachment] });
        } else {
            const urlToImage = './static/anime/animeGirl_Mio_delighted.gif'
            const fileName = urlToImage.match(/[^/]+$/)?.[0]; // This will capture everything after the last slash
            const attachment = new AttachmentBuilder(urlToImage);
            embed.setImage('attachment://' + fileName);
            return await channel.send({ embeds: [embed], files: [attachment] });
        }
    } catch (error) {
        // Part of error logging
        console.error('sendEmbed()', error.stack);
        throw error;
    }

};
// sendMessage(channel, message, []userIds, []reactions) => sends a message
export async function sendMessage(channel: TextChannel, title: string, message: string, urlToImage: string | null, userIds: string[], reactions: string[]): Promise<void> {
    try {
        // Step 1: ping users
        if (userIds.length > 0) {
            const mentions = userIds.map(id => `<@${id}>`).join(' ');
            await channel.send(`${mentions}`);
        }
        // Step 2: send embedMessage
        const formattedMessage =
            `\`\`\`${message}\`\`\`\n`;
        const embedMessage = await sendEmbed(channel, urlToImage, title, formattedMessage);

        // Step 3: add reactions to the embedMessage
        for (const emoji of reactions) {
            await embedMessage.react(emoji);
        }

    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!;
        await centralErrorHandler(atUser, "sendMessage()", error.stack || String(error));
    }
}
// sendReminder(channel, message, userIds) => sends a reminder in the channel and pings userIds
export async function sendReminder(channel: TextChannel, message: string, userIds: string[], reactions: string[]): Promise<void> {
    const reminderTitle = '⏰ Reminder';
    const reminderUrlToImage = null;
    sendMessage(channel, reminderTitle, message, reminderUrlToImage, userIds, reactions);
}

// sendReminderInBotChannel(username, message) => send a reminder in the bot channel
export async function sendReminderInBotChannel(username: string, message: string, reactions: string[]) {
    try {
        // Step 1: Get variables (guild, botChannel, userId)
        const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID as string);
        if (!guild) {
            throw new Error("Main Guild Not Found");
        }
        const botChannel = await returnChannelByGuild(guild);
        const userId = getMemberIdStringByUsername(guild, username);
        const userIds = [userId];

        // Step 2: Set Reminder
        sendReminder(botChannel, message, userIds, reactions);
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!;
        await centralErrorHandler(atUser, "sendReminderInBotChannel()", error.stack || String(error));
    }
}

export async function sendDailyMessage(guildId: string, channelTitle: string, title: string, message: string, userIds: string[], reactions: string[]): Promise<void> {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        throw new Error("Main Guild Not Found");
    }
    const channel = await returnChannelByGuild(guild, channelTitle);
    const dailyUrlToImage = './static/anime/wakeUp/animeGirl_wakeUpPulling.gif'
    sendMessage(channel, title, message, dailyUrlToImage, userIds, reactions);
}
export const interactionReply = async (
    interaction: CommandInteraction,
    localUrl: boolean | null,
    URL: string | null,
    title: string,
    description: string
) => {
    try {
        // Define embed object directly without using EmbedBuilder
        const embed: any = {
            color: parseInt('#FF0000', 16),  // Convert hex color to int
            title: title,
            description: description,
            image: undefined // Default to undefined
        };

        // If 'localUrl' is true, use the attachment URL scheme (local file path)
        if (localUrl && URL) {
            embed.image = { url: 'attachment://' + URL.match(/[^/]+$/)?.[0] }; // Use local attachment
        } else if (URL) {
            // If 'localUrl' is false, use the provided full URL
            embed.image = { url: URL }; // Use the full URL
        }

        // Prepare the reply options
        const replyOptions: any = {
            embeds: [embed],  // Directly use the embed object here
            // ephemeral: true    // Make the message ephemeral
        };

        // If URL is provided and 'localUrl' is true, add the file to the reply (attachment)
        if (localUrl && URL) {
            replyOptions.files = [new AttachmentBuilder(URL)]; // Attach the file if it's a local URL
        }

        // Send the reply with the prepared options
        await interaction.reply({ content: `<@${interaction.user.id}>` });
        await interaction.followUp(replyOptions);
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "interactionReply()", error.stack || String(error))
    }
};

export const sendDailyWord = async (
    channel: TextChannel,
    userIds: string[],
): Promise<void> => {

    // 2025-06-21
    const today = new Date().toISOString().split('T')[0];
    // 20250621
    const hash = today.split('-').join('');
    // maps it to an index of wordPool
    const dailyIndex = parseInt(hash) % wordPool.length;
    const word = wordPool[dailyIndex];

    try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await response.json();
        if (!data || !Array.isArray(data) || !data.length) {
            throw new Error(`No definition found for word: ${word}`);
        }

        const entry = data[0];

        let definitionsText = '';
        for (const meaning of entry.meanings) {
            const partOfSpeech = meaning.partOfSpeech;
            const definitions = meaning.definitions;

            definitionsText += `\n📌 ${partOfSpeech}\n`;
            definitions.forEach((defObj, index) => {
                const def = defObj.definition;
                const example = defObj.example ? `\n> _Example_: ${defObj.example}` : '';
                definitionsText += `• ${def}${example}\n`;
            });
        }

        const title = `📘 **Word of the Day**: **${word}**`;

        sendMessage(channel, title, definitionsText,null,userIds,[])




    } catch (error) {
        console.error(`Failed to fetch definition for ${word}:`, error);
    }
};