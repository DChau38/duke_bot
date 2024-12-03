import { Message, Attachment, TextChannel, ChannelType, VoiceChannel, GuildMember, User, EmbedBuilder, AttachmentBuilder, Guild } from 'discord.js';
import { calculateTimeDifference, sendEmbed, getNicknameOrUsernameElseNull } from './helperFunctionts';
import { client } from './setup'
import config from './config';

// common variables
const TIME_THRESHOLD = 1000;

export const handleSleepCommand = async (message: Message, tracker: Record<string, string>) => {
    const args = message.content.split(' ');
    const inputArgument = args[1];
    const tracker_id = getNicknameOrUsernameElseNull(message.guild as Guild, inputArgument);
    const CURRENT_TIME = new Date();
    const botUsername = "BOT";

    // case: no input argument
    if (!inputArgument) {
        return sendEmbed(message.channel as TextChannel, null, 'Missing Argument', 'Please provide a username or use `!sleepcheck all` to see all tracked users!');
    }
    // case: !sleepcheck all
    else if (inputArgument.toLowerCase() === "all") {
        if (Object.keys(tracker).length === 0) {
            return sendEmbed(message.channel as TextChannel, null, 'No Users Tracked', 'No users are currently being tracked.');
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle("Tracked Users' Offline Status")
            .setDescription("Here are the statuses of all tracked users:");

        if (botUsername in tracker) {
            const botStartTime = new Date(tracker[botUsername]);
            const { days, hours, minutes, seconds } = calculateTimeDifference(botStartTime, CURRENT_TIME);
            embed.addFields({
                name: `**${botUsername}**`,
                value: `Started: ${botStartTime.toLocaleString()}\nTime difference:${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds ago.`,
            });
        }

        // Loop through tracker and calculate offline times
        for (const [tracker_id, offlineTime] of Object.entries(tracker)) {
            if (tracker_id === botUsername) continue;
            const OFFLINE_TIME = new Date(offlineTime);
            const { days, hours, minutes, seconds } = calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);

            if (Math.abs(OFFLINE_TIME.getTime() - new Date(tracker[botUsername]).getTime()) <= TIME_THRESHOLD) {
                embed.addFields({
                    name: `**${tracker_id}**`,
                    value: `(UNKNOWN) OFFLINE SINCE BOT STARTED`,
                });
            } else {
                embed.addFields({
                    name: `**${tracker_id}**`,
                    value: `Last online: ${OFFLINE_TIME.toLocaleString()}\nTime difference:${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`,
                });
            }
        }

        // Send the embed
        return (message.channel as TextChannel).send({ embeds: [embed] });
    }
    // case: did give a string, but it's not a nickname/username/all
    else if (tracker_id === null) {
        return sendEmbed((message.channel as TextChannel), null, 'Invalid argument', 'For your string argument, please provide all, a nickname, or a username');
    }
    // case: username/nickname was given
    else if (tracker_id in tracker) {
        const OFFLINE_TIME = new Date(tracker[tracker_id]);
        const { days, hours, minutes, seconds } = calculateTimeDifference(OFFLINE_TIME, CURRENT_TIME);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(`${tracker_id}'s Status`)
            .setDescription(`Last online: ${OFFLINE_TIME.toLocaleString()}\nTime difference:${days} days, ${hours} hours, ${minutes} minutes, and ${seconds} seconds.`);
        const member = message.guild?.members.cache.get(tracker_id);
        const avatarURL = member?.user.avatarURL();
        if (avatarURL) {
            embed.setThumbnail(avatarURL);
        }

        (message.channel as TextChannel).send({ embeds: [embed] });
    }
    else {
        // Check if the user is currently online (presence)
        const guild = message.guild;
        if (!guild) {
            return sendEmbed(message.channel as TextChannel, null, 'Error', "Could not find the server.");
        }

        // Try to find the member by username first
        let member = guild.members.cache.find((member) => member.user.username === inputArgument);

        // If not found, try searching by nickname
        if (!member) {
            member = guild.members.cache.find((member) => member.nickname === inputArgument);
        }

        if (!member) {
            // Case: user not found in the server by username or nickname
            return sendEmbed(message.channel as TextChannel, null, 'User Not Found', `${inputArgument} not found in the server.`);
        }

        // Case: check if the user is online
        const presence = member.presence;
        if (presence && presence.status !== 'offline') {
            // User is online
            return sendEmbed(message.channel as TextChannel, null, 'User Status', `${inputArgument} is already online!`);
        } else {
            // User is offline
            return sendEmbed(message.channel as TextChannel, null, 'User Status', `${inputArgument} is not online currently.`);
        }
    }
};


export const handleFeaturesCommand = async (message: Message) => {
    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Tang Sanzhang Features')
        .addFields(
            { name: '**!sleepCheck [username]**', value: 'Check how long you slept. Upon waking up and logging on, you have 15m to check the time difference.' },
            { name: '**!arena @username @username2 ...**', value: 'Roll the dice against your opponents in the voice call.' },
            { name: '**!flip**', value: 'Flip the coin to get heads or tails.' },
            { name: '**!hangman**', value: 'Play Hangman with your friends.' },
            { name: '**!joinvc**', value: 'Make me join your current voice channel.' },
            { name: '**!attack @username**', value: 'Send your favorite friend a happy image' },
            { name: '**Reminders**', value: 'Receive periodic reminders.' }
        )
        .setFooter({ text: 'Bot created by Duke :)' });

    (message.channel as TextChannel).send({ embeds: [embed] });
};



export const handleArenaCommand = async (message: Message) => {
    // Non-null assertion for guild (only use in a guild context)
    const guild = message.guild!;

    // Get all mentioned users (convert Collection to array)
    const mentionedUsers = Array.from(message.mentions.users.values());
    if (mentionedUsers.length === 0) {
        return sendEmbed(message.channel as TextChannel, null, 'No Users Mentioned', 'Please mention at least one user to play the roulette with! Usage: !roulette @username1');
    }

    // Check if the caller is trying to include themselves
    if (mentionedUsers.some(user => user.id === message.author.id)) {
        return sendEmbed(message.channel as TextChannel, null, 'Self-Play Not Allowed', 'You cannot play roulette with yourself!');
    }

    // Get GuildMember objects with proper type handling
    const senderMember = guild.members.cache.get(message.author.id);
    const defendingMembers = mentionedUsers
        .map((user: User) => guild.members.cache.get(user.id))
        .filter((member): member is GuildMember => member !== undefined);

    // Validate members exist and are in voice channels
    if (!senderMember) {
        return sendEmbed(message.channel as TextChannel, null, 'Sender Not Found', 'Could not find the sender in the server.');
    }

    if (defendingMembers.length === 0) {
        return sendEmbed(message.channel as TextChannel, null, 'Defenders Not Found', 'Could not find the mentioned users in the server.');
    }

    // Null checks for voice channels
    if (!senderMember.voice?.channel) {
        return sendEmbed(message.channel as TextChannel, null, 'Not in Voice Channel', 'You must be in a voice channel to play roulette!');
    }

    const senderVoiceChannelId = senderMember.voice.channel.id;

    // Check if all defending members are in the same voice channel
    const invalidDefenders = defendingMembers.filter(member =>
        !member.voice?.channel || member.voice.channel.id !== senderVoiceChannelId
    );

    if (invalidDefenders.length > 0) {
        return sendEmbed(message.channel as TextChannel, null, 'Voice Channel Mismatch', 'All users must be in the SAME voice channel to play roulette!');
    }

    // Calculate total participants
    const allParticipants = [senderMember, ...defendingMembers];
    const totalParticipants = allParticipants.length;

    // Probability calculation:
    // 1/x chance ALL get kicked
    // (x-1)/x chance only original caller gets kicked
    const randomValue = Math.random();
    const targetChannel = guild.channels.cache.find(channel =>
        channel.name === "Ten Courts of Hell" && channel.type === ChannelType.GuildVoice
    );

    if (!targetChannel) {
        return sendEmbed(message.channel as TextChannel, null, 'Channel Not Found', "Could not find the target voice channel 'Ten Courts of Hell'.");
    }

    try {
        if (randomValue < 1 / totalParticipants) {
            // ALL participants get kicked
            const kickPromises = defendingMembers.map(member =>
                member.voice.setChannel(targetChannel as VoiceChannel)
            );

            await Promise.all(kickPromises);

            const affectedUsers = defendingMembers
                .map(member => member.user.username)
                .join(' and ');

            return sendEmbed(message.channel as TextChannel, null, 'Roulette Result', `🎲 Roulette Result: ${affectedUsers} were ALL banished from the voice channel!`);
        } else {
            // Original caller gets kicked
            await senderMember.voice.setChannel(targetChannel as VoiceChannel);
            return sendEmbed(message.channel as TextChannel, null, 'Roulette Result', `🎲 Roulette Result: ${senderMember.user.username} was banished from the voice channel!`);
        }
    } catch (error) {
        console.error('Error in roulette command:', error);

        // Provide a more informative error message
        let errorMessage = 'Failed to move the user(s) to the voice channel.';
        if (error instanceof Error) {
            if (error.message.includes('Missing Permissions')) {
                errorMessage = "I don't have permission to move users between voice channels.";
            } else if (error.message.includes('Invalid Voice Channel')) {
                errorMessage = "The target voice channel doesn't exist or is invalid.";
            }
        }

        return sendEmbed(message.channel as TextChannel, null, 'Error', errorMessage);
    }
}


import { joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';


export const handleJoinVCCommand = async (message: Message) => {
    // Error checking: Make sure the message is in a guild
    if (!message.guild) {
        return sendEmbed(message.channel as TextChannel, null, 'Not a Guild', 'This command can only be used in a server.');
    }

    // Get the member sending the command
    const member = message.guild.members.cache.get(message.author.id);

    // Check if the member is in a voice channel (null check for voice.channel)
    if (!member || !member.voice || !member.voice.channel) {
        return sendEmbed(message.channel as TextChannel, null, 'Not in Voice Channel', 'You must be in a voice channel for me to join!');
    }

    try {
        // Join the user's current voice channel
        const connection = joinVoiceChannel({
            channelId: member.voice.channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

    } catch (error) {
        console.error('Error in joining voice channel:', error);
        message.reply('There was an error while trying to join your voice channel.');
    }
};

export const handleAttackCommand = async (message: Message) => {
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
        return sendEmbed(message.channel as TextChannel, null, 'Missing User', 'Please add a user for this feature');
    }

    // make embed
    const embed = new EmbedBuilder()
        .setDescription('you give me c')
        .setColor('#3498db');

    // calculate chance for miss
    const one_percent_chance = Math.floor(Math.random() * 100);
    let current_userid: string;
    // if 1/101 => person in roles
    if (one_percent_chance === 1) {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string)
        const members = await guild.members.fetch();
        // random person from roles
        const correctMembers = members.filter((member) =>
            member.roles.cache.some((role) => config.mis.requiredRoles.includes(role.name)) // Checks if the member has one of the required roles
        );

        const randomMember = correctMembers.random(); // .random() gives you a random element from a collection
        if (!randomMember) {
            return sendEmbed(message.channel as TextChannel, null, 'Error', 'Failed to select a random member.');
        }
        embed.setAuthor({
            name: `${randomMember.user.username}#${randomMember.user.discriminator}`,
            iconURL: randomMember.user.displayAvatarURL(),
        });
        embed.addFields({
            name: '...',
            value: `huh? <@${randomMember.user.id}>`,
        });
        current_userid = randomMember.user.id;

    }
    // if 0/101 => literally random person
    else if (one_percent_chance === 0) {
        const guild = await client.guilds.fetch(process.env.SERVER_ID as string)
        const members = await guild.members.fetch();
        // literally random person in server
        const randomMember = members.random();
        if (!randomMember) {
            return sendEmbed(message.channel as TextChannel, null, 'Error', 'Failed to select a random member.');
        }
        embed.setAuthor({
            name: `${randomMember.user.username}#${randomMember.user.discriminator}`,
            iconURL: randomMember.user.displayAvatarURL(),
        });
        embed.addFields({
            name: '...',
            value: `huh? <@${randomMember.user.id}>`,
        });
        current_userid = randomMember.user.id;
    }
    // regular hit
    else {
        embed.setAuthor({
            name: `${mentionedUser.username}#${mentionedUser.discriminator}`,
            iconURL: mentionedUser.displayAvatarURL(),
        });
        embed.addFields({
            name: 'Bang!',
            value: `<@${mentionedUser.id}> gets hit!`,
        });
        current_userid = mentionedUser.id;


    }

    //attach image + send image
    const attachment = new AttachmentBuilder('./static/Zhu.webp');
    embed.setImage('attachment://Zhu.webp');
    (message.channel as TextChannel).send(`<@${current_userid}>`);
    (message.channel as TextChannel).send({ embeds: [embed], files: [attachment] });


}

export const handleCoinFlipCommand = async (message: Message) => {
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

    // Send the result to the channel
    await (message.channel as TextChannel).send({
        embeds: [embed],
        files: [resultImage],
    });
};
import { generate } from 'random-words'
export const handleHangman = async (message: Message) => {
    const word = generate(); // Get a random word
    let hiddenWord = '_'.repeat(word.length);  // Set the initial hidden word (e.g., '____')
    let attempts = 0;
    let tries = 5;
    let guessedLetters: string[] = [];

    // Create a variable for the channel with the correct type
    const channel = message.channel as TextChannel;

    // Send a welcome message using sendEmbed, including the number of letters to guess
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
        sendEmbed(channel, embedImage, embedTitle, embedDescription);
    });

    // When the collector stops (time runs out or game is won), inform the players
    collector.on('end', () => {
        if (hiddenWord !== word && tries === 0) {
            sendEmbed(channel, './static/hangman_dead.JPG', 'Game Over', `You're out of guesses! The correct word was: ${word}`);
        } else if (hiddenWord !== word && tries > 0) {
            sendEmbed(channel, './static/hangman_dead.JPG', 'Game Over', `Time's up! The correct word was: ${word}`);
        }
    });
};
