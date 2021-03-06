import { Queue, requireUserInVoiceChannel } from '#lib/audio';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { MusicCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types/Discord';
import { ApplyOptions } from '@sapphire/decorators';
import { Permissions, VoiceChannel } from 'discord.js';

const { FLAGS } = Permissions;

@ApplyOptions<MusicCommand.Options>({
	aliases: ['connect'],
	description: LanguageKeys.Commands.Music.JoinDescription,
	extendedHelp: LanguageKeys.Commands.Music.JoinExtended
})
export class UserMusicCommand extends MusicCommand {
	@requireUserInVoiceChannel()
	public async run(message: GuildMessage, args: MusicCommand.Args) {
		// Get the voice channel the member is in
		const { channel } = message.member.voice;

		// If the member is not in a voice channel then throw
		if (!channel) this.error(LanguageKeys.Commands.Music.JoinNoVoiceChannel);

		const { audio } = message.guild;

		// Check if the bot is already playing in this guild
		await this.checkSkyraPlaying(audio, channel);

		// Ensure Skyra has the correct permissions to play music
		await this.resolvePermissions(message, channel);

		// Set the ChannelID to the current channel
		await audio.setTextChannelID(message.channel.id);

		try {
			// Connect to Lavalink and join the voice channel
			await audio.connect(channel.id);
		} catch {
			return message.channel.send(args.t(LanguageKeys.Commands.Music.JoinFailed));
		}

		return message.channel.send(args.t(LanguageKeys.Commands.Music.JoinSuccess, { channel: `<#${channel.id}>` }));
	}

	private async resolvePermissions(message: GuildMessage, voiceChannel: VoiceChannel): Promise<void> {
		const permissions = voiceChannel.permissionsFor(message.guild.me!)!;

		// Administrators can join voice channels even if they are full
		if (voiceChannel.full && !permissions.has(FLAGS.ADMINISTRATOR)) this.error(LanguageKeys.Commands.Music.JoinVoiceFull);
		if (!permissions.has(FLAGS.CONNECT)) this.error(LanguageKeys.Commands.Music.JoinVoiceNoConnect);
		if (!permissions.has(FLAGS.SPEAK)) this.error(LanguageKeys.Commands.Music.JoinVoiceNoSpeak);
	}

	private async checkSkyraPlaying(audio: Queue, voiceChannel: VoiceChannel): Promise<void> {
		const selfVoiceChannel = audio.player.playing ? audio.voiceChannelID : null;
		if (selfVoiceChannel === null) return;

		this.error(voiceChannel.id === selfVoiceChannel ? LanguageKeys.Commands.Music.JoinVoiceSame : LanguageKeys.Commands.Music.JoinVoiceDifferent);
	}
}
