import { Interaction, EmbedBuilder, AttachmentBuilder, TextChannel, CommandInteraction, Message, User, VoiceChannel, Guild, GuildMember, ChannelType } from 'discord.js';
import { generate } from 'random-words'
import * as HELPERS from './features_helpers';
import * as UTILS from './features_utils';
import config from '../config/config';




export async function testFunction(commandInteraction: CommandInteraction) {
    const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID!);
    if (guild) {
        guild.channels.cache.forEach((channel) => {
            console.log(`Channel Name: ${channel.name}, Channel Type: ${ChannelType[channel.type]}`);
        });
    } else {
        console.log("Guild not found");
    }
    const channel = guild?.channels.cache.find(
        (ch) => ch.type === ChannelType.GuildText && ch.name === 'aaa'
    ) as TextChannel;
    await sendEmbed(
        channel,
        'http://localhost:3000/static/timer/animeGirl_Marin_bashful.gif', // global URL
        'Reminder',
        'Don’t forget to do your racket :)'
    );
    await commandInteraction.reply('TEST===TRUE');
}

export const handleCoinFlipInteraction = async (interaction: CommandInteraction) => {
    const coinSides = ['Heads', 'Tails'];
    const result = coinSides[Math.floor(Math.random() * coinSides.length)];

    // Decide the images based on the result (Heads = Win, Tails = Lose)
    const heads_image = new AttachmentBuilder('./static/flip/heads.JPG');  // Local path
    const tails_image = new AttachmentBuilder('./static/flip/tails.JPG');  // Local path

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


export const handleHangmanInteraction = async (interaction: CommandInteraction, channel: TextChannel) => {
    const word = generate(); // Get a random word
    let hiddenWord = '_'.repeat(word.length);  // Set the initial hidden word (e.g., '____')
    let attempts = 0;
    let tries = 5;
    let guessedLetters: string[] = [];

    // Send a welcome message using UTILS.sendEmbed, including the number of letters to guess
    const spacedHiddenWord = '`' + hiddenWord.split('').join(' ') + '`'; // Wrap the spaced hidden word in backticks
    sendEmbed(channel, null, 'Hangman Game Started', `The word has ${word.length} letters: ${spacedHiddenWord}`);

    // Start the message collector without filtering for a specific user
    const filter = (response: Message) => response.content.length === 1 && /^[a-z]$/i.test(response.content); // Only accept valid letter guesses
    const collector = channel.createMessageCollector({ filter, time: config.times.GAME_HANGMAN_GAMETIME });

    collector.on('collect', (response: Message) => {
        const guess = response.content.toLowerCase(); // Get the lowercase version of the guess

        // CHECK: already guessed
        if (guessedLetters.includes(guess)) {
            sendEmbed(channel, null, 'Duplicate Guess', `You already guessed the letter "${guess}".\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\`\nYou have ${tries} attempts remaining`);
            return; // Skip the rest of the code if the letter has been guessed already
        }

        guessedLetters.push(guess); // Add the guess to the list of guessed letters
        attempts++; // Increase the number of attempts made

        let updatedWord = '';

        // Update the hidden word with the correct guess
        for (let i = 0; i < word.length; i++) {
            updatedWord += word[i] === guess ? guess : hiddenWord[i];
        }

        hiddenWord = updatedWord; // Update the hidden word to show progress

        // Calculate the remaining letters (number of underscores in hiddenWord)
        const remainingLetters = hiddenWord.split('_').length - 1;

        let embedTitle = '';
        let embedDescription = '';
        let embedImage = '';

        // If the guess is incorrect, subtract from tries and inform the user
        if (!word.includes(guess)) {
            tries--;
            embedTitle = 'Incorrect Guess';
            embedDescription = `You guessed the letter "${guess}" wrong!\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\``;
        } else {
            // If the guess is correct, inform the user
            embedTitle = 'Correct Guess';
            embedDescription = `Good job! You guessed the letter "${guess}" correctly!\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\``;
        }

        // CHECK: NO TRIES LEFT
        if (tries === 0) {
            embedTitle = 'Game Over';
            embedDescription = `Poor wife and kids... You're out of guesses! The correct word was: \n${word}`;
            embedImage = './static/hangman/hangman_dead.JPG';
            collector.stop();
        }
        // CHECK: IF SUCCESS
        else if (hiddenWord === word) {
            embedTitle = 'Congratulations!';
            embedDescription = `You guessed the word: ${word} in ${attempts} attempts! Well Done!`;
            embedImage = './static/hangman/hangman_alive.JPG';
            collector.stop(); // Stop the game if the word is guessed
        } else {
            // CONTINUE
            const spacedHiddenWord = '`' + hiddenWord.split('').join(' ') + '`'; // Format hidden word with spaces and wrap in backticks
            embedDescription += `\n\nThere are ${remainingLetters} letters left to guess: \n${spacedHiddenWord}\nYou have ${tries} attempts remaining`;
            const invertedTries = 6 - tries;
            embedImage = `./static/hangman/hangman_${invertedTries}.JPG`;
        }

        // Send the embed with updated information
        sendEmbed(channel, embedImage, embedTitle, embedDescription);
    });

    // When the collector stops (time runs out or game is won), inform the players
    collector.on('end', () => {
        if (hiddenWord !== word && tries === 0) {
            sendEmbed(channel, './static/hangman/hangman_dead.JPG', 'Game Over', `You're out of guesses! The correct word was: ${word}`);
        } else if (hiddenWord !== word && tries > 0) {
            sendEmbed(channel, './static/hangman/hangman_dead.JPG', 'Game Over', `Time's up! The correct word was: ${word}`);
        }
    });
};

export const handleAttackInteraction = async (interaction: CommandInteraction): Promise<void> => {
    // Validate mentioned user
    const mentionedUser = interaction.options.get('target')!.user as User;
    if (!mentionedUser) {
        await interactionReply(interaction, true, './static/wumpus/wumpus_crying.gif', 'Missing User', 'Please mention a user for this feature');
        return;
    }

    // Determine attack outcome
    const less_than_one_percent_chance = Math.floor(Math.random() * 101);

    if (less_than_one_percent_chance === 1) {
        // 1% chance: Random member with required roles
        const randomMemberOfRightRole = await HELPERS.selectMemberWithRequiredRoles();
        if (!randomMemberOfRightRole) {
            await interactionReply(interaction, true, './static/wumpus/wumpus_dead.gif', 'Error', 'Failed to select a random member.');
            return;
        }
        await interactionReply(interaction, true, './static/Zhu.webp', `${randomMemberOfRightRole.user.username}#${randomMemberOfRightRole.user.discriminator}`, 'you give me c');
    } else if (less_than_one_percent_chance === 0) {
        // 0% chance: Literally random person in server
        const randomMember = await HELPERS.selectRandomServerMember();
        if (!randomMember) {
            await interactionReply(interaction, true, './static/wumpus/wumpus_dead.gif', 'Error', 'Failed to select a random member.');
            return;
        }
        await interactionReply(interaction, true, './static/Zhu.webp', `${randomMember.user.username}#${randomMember.user.discriminator}`, 'you give me c');
    } else {
        // Regular hit on mentioned user
        await interactionReply(interaction, true, './static/Zhu.webp', `${mentionedUser.username}#${mentionedUser.discriminator}`, `${mentionedUser.username} gets hit!`);
    }
};

export const handleSleepInteraction = async (interaction: CommandInteraction) => {
    // Options: retrieve timezone
    const retrieved_timezone = (interaction.options.get('timezone')?.value as string | null) || 'EST' // EST by default
    const current_timezone = HELPERS.timeZoneMap[retrieved_timezone];

    // Options: retrieve sorting argument
    const sortingArgument = interaction.options.get('sorting_argument')?.value as string | null;

    // Options: retrieve postpone argument
    const postpone = interaction.options.get('postpone')?.value as string | null;

    // user + time variables
    const TIME_THRESHOLD = 1000;
    const mentionedUser = interaction.options.get('target')?.user as User | null;
    const CURRENT_TIME = new Date();
    const botUsername = "BOT";


    // case: postpone until they wake up
    if (postpone !== null && postpone === 'yes') {
        // if they did not attach a user
        if (!mentionedUser) {
            return interactionReply(interaction, true, './static/wumpus/wumpus_crying.gif', 'Missing user', 'You need to tag a user to have their entry\'s deletion postponed');
        }
        const current_time = new Date().toISOString();
        const serverTracker = tracker.get(interaction.guild!.id);  // Get the specific server's tracker map
        // interaction.user.username = who started the interaction 
        const tracker_id = HELPERS.getNicknameOrUsernameElseNull(interaction.guild!, mentionedUser.username);
        const fiften_minutes = 15 * 60 * 1000;
        setTimeout(() => {
            serverTracker?.set(tracker_id as string, current_time);
        }, fiften_minutes);
        return interactionReply(interaction, true, './static/wumpus/wumpus_happy.gif', 'Postpone submitted', '15m later it will be replaced with the current offline time (you can go back to sleep :) )');
    }
    // Case: No input argument (go for all)
    else if (!mentionedUser) {
        const serverTracker = tracker.get(interaction.guild!.id);  // Get the specific server's tracker map

        if (!serverTracker || serverTracker.size === 0) {
            return interactionReply(interaction, true, './static/wumpus/wumpus_dead.gif', 'No Users Tracked', 'No users are currently being tracked.');
        }

        let description = "Here are the statuses of all tracked users:\n\n";

        // Handle the bot user separately
        if (serverTracker.has(botUsername)) {
            const botStartTime = new Date(serverTracker.get(botUsername) as string);
            const { days, hours, minutes, seconds } = UTILS.calculateTimeDifference(botStartTime, CURRENT_TIME);
            const OFFLINE_TIME_TIMEZONE = botStartTime.toLocaleString('en-US', {
                timeZone: current_timezone,
            });
            description += `**${botUsername}**\nStarted: ${OFFLINE_TIME_TIMEZONE} ${retrieved_timezone}\nTime difference: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds ago.\n\n`;
        }

        // Iterate through the tracked users in the server
        for (const [tracker_id, offlineTime] of serverTracker) {
            if (tracker_id === botUsername) continue; // Skip bot user

            if (offlineTime === null) {
                // If the user is invisible (status is null), display them as online
                description += `**${tracker_id}**\n(ONLINE) is currently online\n\n`;
                continue;
            }

            const OFFLINE_TIME = new Date(offlineTime);
            const { days, hours, minutes, seconds } = UTILS.calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);

            if (Math.abs(OFFLINE_TIME.getTime() - new Date(serverTracker.get(botUsername) as string).getTime()) <= TIME_THRESHOLD) {
                description += `**${tracker_id}**\n(UNKNOWN) OFFLINE SINCE BOT STARTED\n\n`;
            } else {
                const OFFLINE_TIME_TIMEZONE = OFFLINE_TIME.toLocaleString('en-US', {
                    timeZone: current_timezone,
                });
                description += `**${tracker_id}**\nLast online: ${OFFLINE_TIME_TIMEZONE} ${retrieved_timezone}\nTime difference: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.\n\n`;
            }
        }

        let descriptionLines = description.split('\n\n');

        // If sortingArgument is provided as 'a' or 'alphabet', sort alphabetically
        if (sortingArgument === 'a' || sortingArgument === 'alphabet') {
            descriptionLines.sort((a, b) => {
                const aUsername = a.match(/^\*\*(.*?)\*\*/)?.[1];
                const bUsername = b.match(/^\*\*(.*?)\*\*/)?.[1];

                if (aUsername && bUsername) {
                    return aUsername.localeCompare(bUsername);
                }

                return 0; // Fallback case if no username found
            });
        } else {
            // Default sorting logic: UNKNOWN first, ONLINE second, then offline users sorted by last online time
            descriptionLines.sort((a, b) => {
                // Check for the statuses (UNKNOWN > ONLINE > offline)
                const aStatus = a.includes("(UNKNOWN)") ? 0 :
                    a.includes("(ONLINE)") ? 1 : 2;
                const bStatus = b.includes("(UNKNOWN)") ? 0 :
                    b.includes("(ONLINE)") ? 1 : 2;

                // If statuses are different, prioritize UNKNOWN > ONLINE > offline
                if (aStatus !== bStatus) {
                    return aStatus - bStatus;
                }

                // If both are UNKNOWN or ONLINE, sort by username alphabetically
                if (aStatus === 0 || aStatus === 1) {
                    const aUsername = a.match(/^\*\*(.*?)\*\*/)?.[1];
                    const bUsername = b.match(/^\*\*(.*?)\*\*/)?.[1];

                    if (aUsername && bUsername) {
                        return aUsername.localeCompare(bUsername);
                    }
                }

                // If both are offline, sort by last online time
                if (aStatus === 2) {
                    const aOfflineTime = a.match(/Last online: (.*?)\n/);
                    const bOfflineTime = b.match(/Last online: (.*?)\n/);

                    if (aOfflineTime && bOfflineTime) {
                        const aDate = new Date(aOfflineTime[1]);
                        const bDate = new Date(bOfflineTime[1]);

                        // Sorting offline users by the most recent offline time (earliest first)
                        return aDate.getTime() - bDate.getTime();
                    }
                }

                return 0; // Default case for rare edge cases
            });
        }

        // Join the sorted chunks back together
        description = descriptionLines.join('\n\n');

        return interactionReply(interaction, true, './static/wumpus/wumpus_happy.gif', "Tracked Users' Offline Status", description);



    }

    // Case: Username/Nickname was given
    const tracker_id = HELPERS.getNicknameOrUsernameElseNull(interaction.guild as Guild, mentionedUser.username) as string;

    const serverTracker = tracker.get(interaction.guild!.id); // Get the specific server's tracker map
    if (!serverTracker) {
        return interactionReply(interaction, true, './static/wumpus/wumpus_dead.gif', 'Error', 'Server tracker not found.');
    }

    // if valid Username/Nickname
    if (serverTracker.has(tracker_id)) {
        const avatarAbsolutePath = mentionedUser.displayAvatarURL();
        // case: null (online). Technically, since there is the 15m grace period it will be a bit "late"
        if (serverTracker.get(tracker_id) === null) {
            return interactionReply(
                interaction,
                false,
                avatarAbsolutePath,
                `${tracker_id}'s Status`,
                `${tracker_id} is currently online.`
            );
        }
        const OFFLINE_TIME = new Date(serverTracker.get(tracker_id) as string);
        const { days, hours, minutes, seconds } = UTILS.calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);
        const OFFLINE_TIME_TIMEZONE = OFFLINE_TIME.toLocaleString('en-US', {
            timeZone: current_timezone
        });
        return interactionReply(
            interaction,
            false,
            avatarAbsolutePath,
            `${tracker_id}'s Status`,
            `Last online: ${OFFLINE_TIME_TIMEZONE} ${retrieved_timezone}\nTime difference: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`
        );
    } else {
        const guild = interaction.guild;
        if (!guild) {
            return interactionReply(interaction, true, './static/wumpus/wumpus_dead.gif', 'Error', "Could not find the server.");
        }

        const username = mentionedUser.username;
        const member = guild.members.cache.find((m) => m.user.username === username);

        if (member?.presence && member.presence.status !== 'offline') {
            return interactionReply(interaction, true, './static/wumpus/wumpus_crying.gif', 'User Status', `${username} is already online!`);
        } else {
            return interactionReply(interaction, true, './static/wumpus/wumpus_crying.gif', 'User Status', `${username} is not part of the club.`);
        }
    }
};

export const handleArenaInteraction = async (interaction: CommandInteraction) => {
    const guild = interaction.guild!;
    const senderMember = interaction.member as GuildMember;

    // Get the argument string from interaction options
    const argsOption = interaction.options.get('opponents', true); // Ensure the option exists and is required
    const argsString = argsOption.value as string; // Explicitly cast the value to a string

    if (!argsString) {
        return interactionReply(
            interaction,
            true, './static/wumpus/wumpus_crying.gif',
            'No Users Mentioned',
            'Please mention at least one user to play roulette with! Usage: /roulette username1 username2'
        );
    }

    // Split the string into user IDs or mentions
    const userIdsOrMentions = argsString.split(' ').filter(Boolean);

    // Validate each mentioned user using UTILS.getNicknameOrUsernameElseNull
    const mentionedUsers = userIdsOrMentions
        .map(idOrMention => {
            // Use UTILS.getNicknameOrUsernameElseNull to validate each mention/username
            const userIdentifier = HELPERS.getNicknameOrUsernameElseNull(guild, idOrMention);
            if (userIdentifier) {
                return guild.members.cache.find(
                    (member) => member.user.username.toLowerCase() === userIdentifier || (member.nickname && member.nickname.toLowerCase() === userIdentifier)
                )?.user;
            }
            return undefined;
        })
        .filter((user): user is GuildMember['user'] => user !== undefined);

    if (mentionedUsers.length === 0) {
        return interactionReply(
            interaction,
            true, './static/wumpus/wumpus_crying.gif',
            'No Valid Users Found',
            'Could not find any valid users from the provided input.'
        );
    }

    // Check if the caller is trying to include themselves
    if (mentionedUsers.some(user => user.id === interaction.user.id)) {
        return interactionReply(
            interaction,
            true, './static/wumpus/wumpus_crying.gif',
            'Self-Play Not Allowed',
            'You cannot play roulette with yourself!'
        );
    }

    // Get GuildMember objects with proper type handling
    const defendingMembers = mentionedUsers
        .map(user => guild.members.cache.get(user.id))
        .filter((member): member is GuildMember => member !== undefined);

    // Validate members exist and are in voice channels
    if (!senderMember.voice?.channel) {
        return interactionReply(
            interaction,
            true, './static/wumpus/wumpus_crying.gif',
            'Not in Voice Channel',
            'You must be in a voice channel to play roulette!'
        );
    }

    const senderVoiceChannelId = senderMember.voice.channel.id;

    // Check if all defending members are in the same voice channel
    const invalidDefenders = defendingMembers.filter(member =>
        !member.voice?.channel || member.voice.channel.id !== senderVoiceChannelId
    );

    if (invalidDefenders.length > 0) {
        return interactionReply(
            interaction,
            true, './static/wumpus/wumpus_crying.gif',
            'Voice Channel Mismatch',
            'All users must be in the SAME voice channel to play roulette!'
        );
    }

    // Calculate total participants
    const allParticipants = [senderMember, ...defendingMembers];
    const totalParticipants = allParticipants.length;

    // Probability calculation:
    // 1/x chance ALL get kicked
    // (x-1)/x chance only original caller gets kicked
    const randomValue = Math.random();
    const targetChannel = guild.channels.cache.find(channel =>
        channel.name === 'Ten Courts of Hell' && channel.isVoiceBased()
    );

    if (!targetChannel) {
        return interactionReply(
            interaction,
            true, './static/wumpus/wumpus_dead.gif',
            'Channel Not Found',
            "Could not find the target voice channel 'Ten Courts of Hell'."
        );
    }

    try {
        if (randomValue < 1 / totalParticipants) {
            // ALL participants get kicked
            const kickPromises = defendingMembers.map(member =>
                member.voice.setChannel(targetChannel as VoiceChannel)
            );

            await Promise.all(kickPromises);

            // If multiple defenders, use plural language
            const kickMessage = defendingMembers.length > 1
                ? `${defendingMembers.length} participants were ALL banished from the voice channel!`
                : `${defendingMembers[0].user.username} was banished from the voice channel!`;

            return interactionReply(
                interaction,
                null,
                null,
                'Roulette Result',
                `🎲 Roulette Result: ${kickMessage}`
            );
        } else {
            // Original caller gets kicked
            await senderMember.voice.setChannel(targetChannel as VoiceChannel);
            return interactionReply(
                interaction,
                null,
                null,
                'Roulette Result',
                `🎲 Roulette Result: ${senderMember.user.username} was banished from the voice channel!`
            );
        }
    } catch (error) {
        console.error('Error in roulette command:', error);

        let errorMessage = 'Failed to move the user(s) to the voice channel.';
        if (error instanceof Error) {
            if (error.message.includes('Missing Permissions')) {
                errorMessage = "I don't have permission to move users between voice channels.";
            } else if (error.message.includes('Invalid Voice Channel')) {
                errorMessage = "The target voice channel doesn't exist or is invalid.";
            }
        }

        return interactionReply(interaction, true, './static/wumpus/wumpus_dead.gif', 'Error', errorMessage);
    }
};


import { joinVoiceChannel } from '@discordjs/voice';
import { tracker } from '../index_setup/index_helpers_2';
import { interactionReply, centralErrorHandler, sendEmbed } from '../utils/utils_structuring';
import { client } from '../index_setup/client';
export const handleJoinVCInteraction = async (interaction: CommandInteraction) => {
    try {
        // Check if the interaction is from a guild (not a DM)
        if (!interaction.guild) {
            await interactionReply(
                interaction,
                null,
                null,
                'Command Not Available',
                'This command can only be used in a server, not in a DM.'
            );
            return;
        }

        // Try to get the user's current voice channel
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member) {
            await interactionReply(
                interaction,
                null,
                null,
                'Member Not Found',
                'I could not find you in this server.'
            );
            return;
        }

        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            await interactionReply(
                interaction,
                null,
                null,
                'Voice Channel Required',
                'You need to be in a voice channel first.'
            );
            return;
        }

        // Ensure the voice channel is a valid guild voice channel
        if (voiceChannel.type !== ChannelType.GuildVoice) {
            await interactionReply(
                interaction,
                null,
                null,
                'Invalid Channel',
                'Please join a valid voice channel.'
            );
            return;
        }

        // Attempt to join the voice channel
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        // Optional: Add error handling for the connection
        connection.on('error', (error) => {
            console.error('Voice connection error:', error);
        });

        // Reply to the interaction
        await interactionReply(
            interaction,
            true, './static/wumpus/wumpus_happy',
            'Voice Channel Joined',
            `Successfully joined the voice channel: ${voiceChannel.name}!`
        );

    } catch (error) {
        console.error('Comprehensive error joining voice channel:', error);
        await  interactionReply(
            interaction,
            true, './static/wumpus/wumpus_dead.gif',
            'Unexpected Error',
            'An unexpected error occurred while trying to join the voice channel.'
        );
    }
};
export const handleTimerInteraction = async (command: CommandInteraction) => {
    try {
        // Step 1: Get variables
        const hours = (command.options.get('hours')?.value || 0) as number;
        const minutes = (command.options.get('minutes')?.value || 0) as number;
        const description = command.options.get('description')?.value || "<NO GIVEN DESCRIPTION>";
        const total_ms = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);

        // Step 2: Send reply to confirm (lef talone sends but causes errors, commneted but sends with no errors)
        /*await UTILS.interactionReply(command, true, './static/wumpus/wumpus_happy.gif', '⏰ Timer Set!',
            `**I will ring in ${hours} hours and ${minutes} minutes**! \n\n\`\`\`*${description}*\`\`\``);*/

        // Step 3: Start the timer
        const startTime = Date.now();
        setTimeout(async () => {
            // Calculate elapsed time
            const elapsed_ms = Date.now() - startTime;
            const elapsed_hours = Math.floor(elapsed_ms / (1000 * 60 * 60));
            const elapsed_minutes = Math.floor((elapsed_ms % (1000 * 60 * 60)) / (1000 * 60));

            // Send the reminder message after the timer expires
            const userMention = `<@${command.user.id}>`;
            const channel = command.channel as TextChannel
            await channel?.send({
                content: `⏰ ${userMention} **Timer finished!**\n\n**This timer was started ${elapsed_hours} hours and ${elapsed_minutes} minutes ago**\n\n\`\`\`${description}\`\`\``
            });

            sendEmbed(
                channel,
                './static/timer/animeGirl_Marin_bashful.gif',
                'Timer’s up!',
                `This timer was started ${elapsed_hours} hours and ${elapsed_minutes} minutes ago\n\n\`\`\`${description}\`\`\``
            );
        }, total_ms);  // Use total_ms as the delay in milliseconds
    } catch (error) {
        const atUser = process.env.DISCORD_ACCOUNT_ID!
        await centralErrorHandler(atUser, "handleTimerInteraction()", error.stack || String(error))
    }
}
