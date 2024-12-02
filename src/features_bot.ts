import { Interaction, EmbedBuilder, AttachmentBuilder, TextChannel,CommandInteraction } from 'discord.js';
export const handleCoinFlipCommand=async(interaction:CommandInteraction)=>{
    const coinSides = ['Heads', 'Tails'];
    const result = coinSides[Math.floor(Math.random() * coinSides.length)];

    // Decide the images based on the result (Heads = Win, Tails = Lose)
    const heads_image = new AttachmentBuilder('./static/heads.JPG');  // Local path
    const tails_image = new AttachmentBuilder('./static/tails.JPG');  // Local path

    // Select the image based on the coin flip result
    const resultImage = result === 'Heads' ? heads_image : tails_image;
    const imageFileName = result === 'Heads' ? 'heads.JPG' : 'tails.JPG';

    // Create an embed for the result
    const embed = new EmbedBuilder()
        .setColor('#FFD700')  // Gold color for the coin flip
        .setTitle('Coin Flip Result')
        .setDescription(`The coin landed on **${result}**!`)
        .setImage(`attachment://${imageFileName}`);  // Dynamically set the image

    // Respond to the interaction
    await interaction.reply({
        embeds: [embed],
        files: [resultImage],
    });
}