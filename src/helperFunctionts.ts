import {EmbedBuilder,Channel, TextChannel} from 'discord.js';
export const calculateTimeDifference = (startTime: Date, endTime: Date) => {
    const timeDiff = endTime.getTime() - startTime.getTime();
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
};

export const sendEmbed = async (channel: TextChannel, title: string, description: string) => {
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(title)
      .setDescription(description);
  
    try {
      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending embed:', error);
    }
  };
  