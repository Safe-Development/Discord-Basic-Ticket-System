const { Client, GatewayIntentBits, Partials, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChannelType, SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID;
let supportLogChannelId = null;

client.once('ready', () => {
	console.log('Support Bot is online!');
	
	const guild = client.guilds.cache.first();
	if (guild) {
		const command = new SlashCommandBuilder()
			.setName('support-log')
			.setDescription('Set the support log channel')
			.addChannelOption(option =>
				option.setName('channel')
					.setDescription('The channel to log resolved tickets')
					.setRequired(true)
			);
		guild.commands.create(command.toJSON());
	}
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	if (interaction.commandName === 'support-log') {
		if (interaction.user.id !== interaction.guild.ownerId) {
			return interaction.reply({ content: 'Bu komutu kullanma yetkiniz yok.', ephemeral: true });
		}
		const channel = interaction.options.getChannel('channel');
		supportLogChannelId = channel.id; 
		return interaction.reply({ content: `Support log channel set to <#${channel.id}>.`, ephemeral: true });
	}

	if (interaction.commandName === 'support') {
		const channel = interaction.options.getChannel('channel');
		const message = interaction.options.getString('message');
		const image = interaction.options.getAttachment('image');
		const type = interaction.options.getString('type');

		let defaultMessage = '';
		if (!message) {
			if (type === 'type1') {
				defaultMessage = '$afe Development - If you need support, you can contact our team. We will assist you shortly.';
			} else if (type === 'type2') {
				defaultMessage = '$afe Development - Eğer desteğe ihtiyacınız varsa ekibimizle iletişime geçebilirsiniz. En kısa sürede sizinle ilgileneceğiz.';
			} else if (type === 'type3') {
				defaultMessage = '$afe Development - Если вам нужна помощь, вы можете связаться с нашей командой. Мы свяжемся с вами в ближайшее время.';
			}
		}

		const embed = new EmbedBuilder()
			.setTitle(type === 'type1' ? 'Support Center' : type === 'type2' ? 'Destek Merkezi' : 'Центр поддержки')
			.setDescription(message || defaultMessage)
			.setColor(type === 'type1' ? 0x3498db : type === 'type2' ? 0x2ecc71 : 0xe74c3c)
			.setFooter({ text: "$afe Development © 2025 godmodule" });

		if (image) {
			embed.setImage(image.url);
		}

		const button = new ButtonBuilder()
			.setCustomId('createticket')
			.setLabel('Support')
			.setStyle(ButtonStyle.Success);

		const row = new ActionRowBuilder().addComponents(button);
		await channel.send({ embeds: [embed], components: [row] });
		await interaction.reply({ content: 'Destek mesajı gönderildi!', ephemeral: true });
	}
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isButton()) return;

	try {
		await interaction.deferReply({ ephemeral: true });

		if (interaction.customId === 'createticket') {
			if (!interaction.guild) return;

			const type = interaction.message.embeds[0].title === 'Support Center' ? 'type1' :
				interaction.message.embeds[0].title === 'Destek Merkezi' ? 'type2' : 'type3';

			const thread = await interaction.channel.threads.create({
				name: `ticket-${interaction.user.username}`,
				autoArchiveDuration: 1440,
				type: ChannelType.PrivateThread
			});

			await thread.members.add(interaction.user.id);
			
			const supportRole = interaction.guild.roles.cache.get(SUPPORT_ROLE_ID);
			if (supportRole) {
				for (const member of supportRole.members.values()) {
					await thread.members.add(member.id);
				}
			}

			let welcomeMessage = '';
			if (type === 'type1') {
				welcomeMessage = 'Thank you for creating a ticket. Our support team will assist you shortly.';
			} else if (type === 'type2') {
				welcomeMessage = 'Ticket oluşturduğunuz için teşekkürler. Destek ekibimiz kısa sürede size yardımcı olacaktır.';
			} else if (type === 'type3') {
				welcomeMessage = 'Спасибо за создание тикета. Наша служба поддержки свяжется с вами в ближайшее время.';
			}

			
			const welcomeEmbed = new EmbedBuilder()
				.setTitle('Ticket Created')
				.setDescription(`${welcomeMessage}\n\nTicket created by <@${interaction.user.id}>`)
				.setColor(type === 'type1' ? 0x3498db : type === 'type2' ? 0x2ecc71 : 0xe74c3c)
				.setTimestamp();

			const resolveButton = new ButtonBuilder()
				.setCustomId('resolve_ticket')
				.setLabel('Resolve')
				.setStyle(ButtonStyle.Danger);

			const row = new ActionRowBuilder().addComponents(resolveButton);

			
			await thread.send({ embeds: [welcomeEmbed], components: [row] });

			await interaction.editReply({
				content: type === 'type1'
					? `Your support ticket has been created: ${thread}`
					: type === 'type2'
						? `Destek talebiniz oluşturuldu: ${thread}`
						: `Ваш тикет поддержки создан: ${thread}`
			});
		} else if (interaction.customId === 'resolve_ticket') {
			if (!interaction.channel.isThread()) {
				return interaction.editReply({
					content: 'Bu komut sadece destek threadlerinde kullanılabilir.',
					ephemeral: true
				});
			}

			
			const messages = await interaction.channel.messages.fetch({ limit: 100 });
			const firstMessage = messages.last();
			const ticketCreator = firstMessage ? firstMessage.author : null;
			const ticketCreationTime = firstMessage ? firstMessage.createdAt : null;
			const resolutionTime = new Date();
			const duration = ticketCreationTime ? Math.floor((resolutionTime - ticketCreationTime) / 1000) : null;

			const transcriptContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Ticket Transcript</title>
					<style>
						body { font-family: Arial, sans-serif; line-height: 1.6; }
						.message { margin-bottom: 10px; }
						.author { font-weight: bold; }
						.content { margin-left: 20px; }
					</style>
				</head>
				<body>
					<h1>Ticket Transcript</h1>
					<p>Resolved by: ${interaction.user.tag}</p>
					<p>Ticket created by: ${ticketCreator ? ticketCreator.tag : 'Unknown'}</p>
					<p>Ticket creation time: ${ticketCreationTime ? ticketCreationTime.toLocaleString() : 'Unknown'}</p>
					<p>Resolution time: ${resolutionTime.toLocaleString()}</p>
					<p>Duration: ${duration ? `${Math.floor(duration / 60)} minutes and ${duration % 60} seconds` : 'Unknown'}</p>
					<hr>
					${messages.map(msg => `
						<div class="message">
							<span class="author">${msg.author.tag}:</span>
							<span class="content">${msg.content}</span>
						</div>
					`).join('')}
				</body>
				</html>
			`;

			const filePath = `./transcript-${interaction.channel.id}.html`;
			fs.writeFileSync(filePath, transcriptContent);

			
			const embed = new EmbedBuilder()
				.setTitle(`Ticket Resolved - <@&${SUPPORT_ROLE_ID}>`)
				.setDescription(`This ticket has been marked as resolved by ${interaction.user.tag}.`)
				.addFields(
					{ name: 'Ticket Creator', value: ticketCreator ? `<@${ticketCreator.id}> (${ticketCreator.tag})` : 'Unknown', inline: true },
					{ name: 'Resolved By', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
					{ name: 'Ticket Creation Time', value: ticketCreationTime ? ticketCreationTime.toLocaleString() : 'Unknown', inline: true },
					{ name: 'Resolution Time', value: resolutionTime.toLocaleString(), inline: true },
					{ name: 'Duration', value: duration ? `${Math.floor(duration / 60)} minutes and ${duration % 60} seconds` : 'Unknown', inline: true },
					{ name: 'Support Role', value: `<@&${SUPPORT_ROLE_ID}>`, inline: true }
				)
				.setColor(0x00FF00)
				.setTimestamp();

			if (supportLogChannelId) {
				const logChannel = interaction.guild.channels.cache.get(supportLogChannelId);
				if (logChannel) {
					const attachment = new AttachmentBuilder(filePath);
					await logChannel.send({
						content: `<@&${SUPPORT_ROLE_ID}> Ticket resolved by <@${interaction.user.id}>`,
						embeds: [embed],
						files: [attachment]
					});
				}
			}

			await interaction.editReply({ embeds: [embed] });
			await interaction.channel.setArchived(true);

			fs.unlinkSync(filePath);
		}
	} catch (error) {
		console.error('Error handling button interaction:', error);
		await interaction.editReply({
			content: 'An error occurred while processing your request.',
			ephemeral: true
		}).catch(console.error);
	}
});

client.login(process.env.TOKEN);
