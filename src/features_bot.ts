import { Interaction, EmbedBuilder, AttachmentBuilder, TextChannel, CommandInteraction, Message, User, VoiceChannel, Guild, GuildMember, ChannelType } from 'discord.js';
import { generate } from 'random-words'
import * as HELPERS from './features_helpers';
import * as UTILS from './features_utils';
import config from './config';
import { client, tracker } from './setup';



export async function testFunction(commandInteraction: CommandInteraction) {

    await commandInteraction.reply('TEST===TRUE');
}

export const handleCoinFlipInteraction = async (interaction: CommandInteraction) => {
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


export const handleHangmanInteraction = async (interaction: CommandInteraction, channel: TextChannel) => {
    const word = generate(); // Get a random word
    let hiddenWord = '_'.repeat(word.length);  // Set the initial hidden word (e.g., '____')
    let attempts = 0;
    let tries = 5;
    let guessedLetters: string[] = [];

    // Send a welcome message using UTILS.sendEmbed, including the number of letters to guess
    const spacedHiddenWord = '`' + hiddenWord.split('').join(' ') + '`'; // Wrap the spaced hidden word in backticks
    UTILS.sendEmbed(channel, null, 'Hangman Game Started', `The word has ${word.length} letters: ${spacedHiddenWord}`);

    // Start the message collector without filtering for a specific user
    const filter = (response: Message) => response.content.length === 1 && /^[a-z]$/i.test(response.content); // Only accept valid letter guesses
    const collector = channel.createMessageCollector({ filter, time: config.times.GAME_HANGMAN_GAMETIME });

    collector.on('collect', (response: Message) => {
        const guess = response.content.toLowerCase(); // Get the lowercase version of the guess

        // CHECK: already guessed
        if (guessedLetters.includes(guess)) {
            UTILS.sendEmbed(channel, null, 'Duplicate Guess', `You already guessed the letter "${guess}".\nHere are the letters you've guessed so far: \n\`${guessedLetters.join(', ')}\`\nYou have ${tries} attempts remaining`);
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
            embedImage = './static/hangman_dead.JPG';
            collector.stop();
        }
        // CHECK: IF SUCCESS
        else if (hiddenWord === word) {
            embedTitle = 'Congratulations!';
            embedDescription = `You guessed the word: ${word} in ${attempts} attempts! Well Done!`;
            embedImage = './static/hangman_alive.JPG';
            collector.stop(); // Stop the game if the word is guessed
        } else {
            // CONTINUE
            const spacedHiddenWord = '`' + hiddenWord.split('').join(' ') + '`'; // Format hidden word with spaces and wrap in backticks
            embedDescription += `\n\nThere are ${remainingLetters} letters left to guess: \n${spacedHiddenWord}\nYou have ${tries} attempts remaining`;
            const invertedTries = 6 - tries;
            embedImage = `./static/hangman_${invertedTries}.JPG`;
        }

        // Send the embed with updated information
        UTILS.sendEmbed(channel, embedImage, embedTitle, embedDescription);
    });

    // When the collector stops (time runs out or game is won), inform the players
    collector.on('end', () => {
        if (hiddenWord !== word && tries === 0) {
            UTILS.sendEmbed(channel, './static/hangman_dead.JPG', 'Game Over', `You're out of guesses! The correct word was: ${word}`);
        } else if (hiddenWord !== word && tries > 0) {
            UTILS.sendEmbed(channel, './static/hangman_dead.JPG', 'Game Over', `Time's up! The correct word was: ${word}`);
        }
    });
};

export const handleAttackInteraction = async (interaction: CommandInteraction): Promise<void> => {
    // Validate mentioned user
    const mentionedUser = interaction.options.get('target')!.user as User;
    if (!mentionedUser) {
        await UTILS.interactionReply(interaction, null, 'Missing User', 'Please mention a user for this feature');
        return;
    }

    // Determine attack outcome
    const less_than_one_percent_chance = Math.floor(Math.random() * 101);

    if (less_than_one_percent_chance === 1) {
        // 1% chance: Random member with required roles
        const randomMemberOfRightRole = await HELPERS.selectMemberWithRequiredRoles();
        if (!randomMemberOfRightRole) {
            await UTILS.interactionReply(interaction, null, 'Error', 'Failed to select a random member.');
            return;
        }
        await UTILS.interactionReply(interaction, './static/Zhu.webp', `${randomMemberOfRightRole.user.username}#${randomMemberOfRightRole.user.discriminator}`, 'you give me c');
    } else if (less_than_one_percent_chance === 0) {
        // 0% chance: Literally random person in server
        const randomMember = await HELPERS.selectRandomServerMember();
        if (!randomMember) {
            await UTILS.interactionReply(interaction, null, 'Error', 'Failed to select a random member.');
            return;
        }
        await UTILS.interactionReply(interaction, './static/Zhu.webp', `${randomMember.user.username}#${randomMember.user.discriminator}`, 'you give me c');
    } else {
        // Regular hit on mentioned user
        await UTILS.interactionReply(interaction, './static/Zhu.webp', `${mentionedUser.username}#${mentionedUser.discriminator}`, `${mentionedUser.username} gets hit!`);
    }
};

const TIME_THRESHOLD = 1000;
export const handleSleepInteraction = async (interaction: CommandInteraction) => {
    const mentionedUser = interaction.options.get('target')?.user as User | null;
    const CURRENT_TIME = new Date();
    const botUsername = "BOT";

    // Get the sorting argument from the options
    const sortingArgument = interaction.options.get('sorting_argument')?.value as string | null;


    // Case: No input argument (go for all)
    if (!mentionedUser) {
        const serverTracker = tracker.get(interaction.guild!.id);  // Get the specific server's tracker map

        if (!serverTracker || serverTracker.size === 0) {
            return UTILS.interactionReply(interaction, null, 'No Users Tracked', 'No users are currently being tracked.');
        }

        let description = "Here are the statuses of all tracked users:\n\n";

        // Handle the bot user separately
        if (serverTracker.has(botUsername)) {
            const botStartTime = new Date(serverTracker.get(botUsername) as string);
            const { days, hours, minutes, seconds } = HELPERS.calculateTimeDifference(botStartTime, CURRENT_TIME);
            description += `**${botUsername}**\nStarted: ${botStartTime.toLocaleString()}\nTime difference: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds ago.\n\n`;
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
            const { days, hours, minutes, seconds } = HELPERS.calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);

            if (Math.abs(OFFLINE_TIME.getTime() - new Date(serverTracker.get(botUsername) as string).getTime()) <= TIME_THRESHOLD) {
                description += `**${tracker_id}**\n(UNKNOWN) OFFLINE SINCE BOT STARTED\n\n`;
            } else {
                description += `**${tracker_id}**\nLast online: ${OFFLINE_TIME.toLocaleString()}\nTime difference: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.\n\n`;
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

                return 0;
            });
        } else {
            // Default sorting logic: UNKNOWN first, ONLINE second, then others (offline users)
            descriptionLines.sort((a, b) => {
                // Extract the status part (UNKNOWN, ONLINE, or others)
                const aStatus = a.includes("(UNKNOWN)") ? 0 :
                    a.includes("(ONLINE)") ? 1 : 2;
                const bStatus = b.includes("(UNKNOWN)") ? 0 :
                    b.includes("(ONLINE)") ? 1 : 2;

                // Sort by status first (UNKNOWN > ONLINE > others)
                if (aStatus !== bStatus) {
                    return aStatus - bStatus;
                }

                // If statuses are the same, sort alphabetically by username
                const aUsername = a.match(/^\*\*(.*?)\*\*/)?.[1]; // Extract the username from **username**
                const bUsername = b.match(/^\*\*(.*?)\*\*/)?.[1];

                if (aUsername && bUsername) {
                    return aUsername.localeCompare(bUsername);
                }

                return 0; // Fallback case if no username found
            });
        }

        // Join the sorted chunks back together
        description = descriptionLines.join('\n\n');

        return UTILS.interactionReply(interaction, null, "Tracked Users' Offline Status", description);


    }

    // Case: Username/Nickname was given
    const tracker_id = UTILS.getNicknameOrUsernameElseNull(interaction.guild as Guild, mentionedUser.username) as string;

    const serverTracker = tracker.get(interaction.guild!.id); // Get the specific server's tracker map
    if (!serverTracker) {
        return UTILS.interactionReply(interaction, null, 'Error', 'Server tracker not found.');
    }

    if (tracker_id in serverTracker) {
        // case: null (online)
        if (serverTracker.get(tracker_id) === null) {
            return UTILS.interactionReply(
                interaction,
                null,
                `${tracker_id}'s Status`,
                `${tracker_id} is currently online.`
            );
        }
        const OFFLINE_TIME = new Date(serverTracker.get(tracker_id) as string);
        const { days, hours, minutes, seconds } = HELPERS.calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);

        return UTILS.interactionReply(
            interaction,
            null,
            `${tracker_id}'s Status`,
            `Last online: ${OFFLINE_TIME.toLocaleString()}\nTime difference: ${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`
        );
    } else {
        const guild = interaction.guild;
        if (!guild) {
            return UTILS.interactionReply(interaction, null, 'Error', "Could not find the server.");
        }

        const username = mentionedUser.username;
        const member = guild.members.cache.find((m) => m.user.username === username);

        if (member?.presence && member.presence.status !== 'offline') {
            return UTILS.interactionReply(interaction, null, 'User Status', `${username} is already online!`);
        } else {
            return UTILS.interactionReply(interaction, null, 'User Status', `${username} is not part of the club.`);
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
        return UTILS.interactionReply(
            interaction,
            null,
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
            const userIdentifier = UTILS.getNicknameOrUsernameElseNull(guild, idOrMention);
            if (userIdentifier) {
                return guild.members.cache.find(
                    (member) => member.user.username.toLowerCase() === userIdentifier || (member.nickname && member.nickname.toLowerCase() === userIdentifier)
                )?.user;
            }
            return undefined;
        })
        .filter((user): user is GuildMember['user'] => user !== undefined);

    if (mentionedUsers.length === 0) {
        return UTILS.interactionReply(
            interaction,
            null,
            'No Valid Users Found',
            'Could not find any valid users from the provided input.'
        );
    }

    // Check if the caller is trying to include themselves
    if (mentionedUsers.some(user => user.id === interaction.user.id)) {
        return UTILS.interactionReply(
            interaction,
            null,
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
        return UTILS.interactionReply(
            interaction,
            null,
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
        return UTILS.interactionReply(
            interaction,
            null,
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
        return UTILS.interactionReply(
            interaction,
            null,
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

            return UTILS.interactionReply(
                interaction,
                null,
                'Roulette Result',
                `🎲 Roulette Result: ${kickMessage}`
            );
        } else {
            // Original caller gets kicked
            await senderMember.voice.setChannel(targetChannel as VoiceChannel);
            return UTILS.interactionReply(
                interaction,
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

        return UTILS.interactionReply(interaction, null, 'Error', errorMessage);
    }
};


import { joinVoiceChannel } from '@discordjs/voice';
export const handleJoinVCInteraction = async (interaction: CommandInteraction) => {
    try {
        // Check if the interaction is from a guild (not a DM)
        if (!interaction.guild) {
            await UTILS.interactionReply(
                interaction,
                null,
                'Command Not Available',
                'This command can only be used in a server, not in a DM.'
            );
            return;
        }

        // Try to get the user's current voice channel
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (!member) {
            await UTILS.interactionReply(
                interaction,
                null,
                'Member Not Found',
                'I could not find you in this server.'
            );
            return;
        }

        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            await UTILS.interactionReply(
                interaction,
                null,
                'Voice Channel Required',
                'You need to be in a voice channel first.'
            );
            return;
        }

        // Ensure the voice channel is a valid guild voice channel
        if (voiceChannel.type !== ChannelType.GuildVoice) {
            await UTILS.interactionReply(
                interaction,
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
        await UTILS.interactionReply(
            interaction,
            null,
            'Voice Channel Joined',
            `Successfully joined the voice channel: ${voiceChannel.name}!`
        );

    } catch (error) {
        console.error('Comprehensive error joining voice channel:', error);
        await UTILS.interactionReply(
            interaction,
            null,
            'Unexpected Error',
            'An unexpected error occurred while trying to join the voice channel.'
        );
    }
};