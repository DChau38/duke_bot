import { TextChannel, EmbedBuilder, AttachmentBuilder, CommandInteraction, ChannelType, Guild } from "discord.js";
import { client } from "../index_setup/client";
import { ChatMessage, userChatHistories } from "../index_setup/globalData";

export const calculateTimeDifference = (startTime: Date, endTime: Date) => {
    const timeDiff = endTime.getTime() - startTime.getTime();

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
};

export const convertHoursToMinutes = (hours: number): number => 
  hours * 60;

export const convertMinutesToHours = (minutes: number): number => 
  minutes / 60;

export const convertHoursToSeconds = (hours: number): number => 
  hours * 60 * 60;

export const convertSecondsToHours = (seconds: number): number => 
  seconds / 3600;

export const convertMinutesToSeconds = (minutes: number): number => 
  minutes * 60;

export const convertSecondsToMinutes = (seconds: number): number => 
  seconds / 60;

export const convertMinutesToMilliseconds = (minutes: number): number => 
  minutes * 60 * 1000;

export const convertMillisecondsToMinutes = (milliseconds: number): number => 
  milliseconds / (60 * 1000);

export const convertHoursToMilliseconds = (hours: number): number => 
  hours * 60 * 60 * 1000;

export const convertMillisecondsToHours = (milliseconds: number): number => 
  milliseconds / (60 * 60 * 1000);

export const convertSecondsToMilliseconds = (seconds: number): number => 
  seconds * 1000;

export const convertMillisecondsToSeconds = (milliseconds: number): number => 
  milliseconds / 1000;

export const getUserHistory = (userId: string): ChatMessage[] => {
    let history = userChatHistories.get(userId);

    if (!history) {
        history = [
            {
                role: "system",
                content:
                    "You are Maya. You speak with a warm, loving, caring girlfriend energy. You are supportive, soft-spoken, and reassuring. Your tone is gentle, affectionate, and emotionally understanding."
            }
        ];

        userChatHistories.set(userId, history);
    }

    return history;
};
