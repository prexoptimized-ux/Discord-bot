const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    PermissionsBitField
} = require('discord.js');

const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');

require('dotenv').config();

// CLIENT
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// BOT ONLINE
client.once('clientReady', () => {
    console.log(`${client.user.tag} is online!`);
});

// ============================================
// VERIFY PANEL COMMAND
// ============================================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // SEND VERIFY PANEL
    if (
    message.content === '!verifypanel' &&
    message.channel.id === process.env.VERIFY_CHANNEL_ID
) {

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🔐 Verification Required')
            .setDescription(
                'Click the button below to verify yourself and unlock all channels.'
            )
            .setFooter({
                text: 'Prex Optimization'
            })
            .setTimestamp();

        const verifyButton = new ButtonBuilder()
            .setCustomId('verify')
            .setLabel('Verify')
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(verifyButton);

        await message.channel.send({
            embeds: [embed],
            components: [row]
        });
    }
});

// ============================================
// VERIFY BUTTON SYSTEM
// ============================================

client.on(Events.InteractionCreate, async interaction => {

    if (!interaction.isButton()) return;

    // VERIFY BUTTON
    if (interaction.customId === 'verify') {

        try {

            const verifiedRole = interaction.guild.roles.cache.get(
                process.env.VERIFY_ROLE_ID
            );

            const memberRole = interaction.guild.roles.cache.get(
                process.env.MEMBER_ROLE_ID
            );

            // GIVE ROLES
            await interaction.member.roles.add([
                verifiedRole,
                memberRole
            ]);

            // WELCOME EMBED
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('Welcome to Prex Optimization !!')
                .setDescription(
                    `Hey ${interaction.user}, Thanks for Verifying !!`
                )
                .addFields(
                    {
                        name: '👥 Member Count',
                        value: `${interaction.guild.memberCount}`,
                        inline: false
                    },
                    {
                        name: '🆔 User ID',
                        value: `${interaction.user.id}`,
                        inline: false
                    },
                    {
                        name: '🎭 Roles',
                        value: `${verifiedRole}, ${memberRole}`,
                        inline: false
                    }
                )
                .setThumbnail(
                    interaction.user.displayAvatarURL({
                        dynamic: true
                    })
                )
                .setFooter({
                    text: 'Prex Optimization'
                })
                .setTimestamp();

            const welcomeChannel = interaction.guild.channels.cache.get(
                process.env.WELCOME_CHANNEL_ID
            );

            // SEND WELCOME MESSAGE
            await welcomeChannel.send({
                embeds: [welcomeEmbed]
            });

            // REPLY
            await interaction.reply({
                content: '✅ You are now verified!',
                ephemeral: true
            });

        } catch (err) {

            console.error(err);

            await interaction.reply({
                content: '❌ Verification failed.',
                ephemeral: true
            });
        }
    }
});

// ============================================
// SUBSCRIBER CHECK SYSTEM
// ============================================

client.on('messageCreate', async (message) => {

    if (message.author.bot) return;

    // ONLY CHECK PROOF CHANNEL
    if (message.channel.id !== process.env.PROOF_CHANNEL_ID) return;

    // CHECK IMAGE
    const attachment = message.attachments.first();

    if (!attachment) {

        await message.reply(
            '❌ Please upload a subscription screenshot.'
        );

        return;
    }

    try {

        // DOWNLOAD IMAGE
        const response = await axios({
            url: attachment.url,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        fs.writeFileSync('proof.png', response.data);

        // OCR SCAN
        const result = await Tesseract.recognize(
            'proof.png',
            'eng'
        );

        const text = result.data.text.toLowerCase();

        console.log(text);

        // REQUIRED TEXT
        const requiredChannel = 'prex optimization';

        // VALID SCREENSHOT
        if (
            text.includes(requiredChannel) &&
            text.includes('subscribed')
        ) {

            const subscriberRole = message.guild.roles.cache.get(
                process.env.SUBSCRIBER_ROLE_ID
            );

            // GIVE ROLE
            await message.member.roles.add(subscriberRole);

            await message.reply(
                '✅ You are subscribed! Free Stuff channel is now unlocked.'
            );

        } else {

            // TIMEOUT 5 MINUTES
            await message.member.timeout(
                5 * 60 * 1000,
                'Fake subscription proof'
            );

            await message.reply(
                '❌ You are not subscribed. You got timeout for 5 minutes.'
            );
        }

    } catch (err) {

        console.error(err);

        await message.reply(
            '❌ Failed to analyze screenshot.'
        );
    }
});

// LOGIN
client.login(process.env.TOKEN);
