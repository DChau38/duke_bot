import { AttachmentBuilder, CommandInteraction, EmbedBuilder, TextChannel } from "discord.js";
import config from "../config/config";
import { client } from "../index_setup/client";

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

export const sendEmbed = async (channel: TextChannel, urlToImage: string | null, title: string, description: string) => {
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
            await channel.send({ embeds: [embed], files: [attachment] });
        } else {
            const urlToImage = './static/anime/animeGirl_Mio_delighted.gif'
            const fileName = urlToImage.match(/[^/]+$/)?.[0]; // This will capture everything after the last slash
            const attachment = new AttachmentBuilder(urlToImage);
            embed.setImage('attachment://' + fileName);
            await channel.send({ embeds: [embed], files: [attachment] });
        }
    } catch (error) {
        // Part of error logging
        console.error('sendEmbed()', error.stack);
    }

};

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