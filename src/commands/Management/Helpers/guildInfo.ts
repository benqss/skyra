import { DbSet } from '#lib/database';
import { SkyraEmbed } from '#lib/discord';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import type { GuildMessage } from '#lib/types';
import { ApplyOptions } from '@sapphire/decorators';
import type { Role } from 'discord.js';

const SORT = (x: Role, y: Role) => Number(y.position > x.position) || Number(x.position === y.position) - 1;

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['serverinfo'],
	cooldown: 15,
	description: LanguageKeys.Commands.Management.GuildInfoDescription,
	extendedHelp: LanguageKeys.Commands.Management.GuildInfoExtended,
	permissions: ['EMBED_LINKS'],
	runIn: ['text']
})
export class UserCommand extends SkyraCommand {
	public async run(message: GuildMessage, args: SkyraCommand.Args) {
		let tChannels = 0;
		let vChannels = 0;
		let cChannels = 0;
		for (const channel of message.guild.channels.cache.values()) {
			if (channel.type === 'text' || channel.type === 'news') tChannels++;
			else if (channel.type === 'voice') vChannels++;
			else if (channel.type === 'category') cChannels++;
		}

		const serverInfoTitles = args.t(LanguageKeys.Commands.Management.GuildInfoTitles);
		const roles = [...message.guild.roles.cache.values()].sort(SORT);
		// Pop off the @everyone role
		roles.pop();
		const owner = await this.context.client.users.fetch(message.guild.ownerID);

		return message.send(
			new SkyraEmbed()
				.setColor(await DbSet.fetchColor(message))
				.setThumbnail(message.guild.iconURL()!)
				.setTitle(`${message.guild.name} [${message.guild.id}]`)
				.splitFields(args.t(LanguageKeys.Commands.Tools.WhoisMemberRoles, { count: roles.length }), roles.join(' '))
				.addField(
					serverInfoTitles.MEMBERS,
					args.t(LanguageKeys.Commands.Management.GuildInfoMembers, {
						memberCount: message.guild.memberCount,
						owner
					}),
					true
				)
				.addField(
					serverInfoTitles.CHANNELS,
					args.t(LanguageKeys.Commands.Management.GuildInfoChannels, {
						text: tChannels,
						voice: vChannels,
						categories: cChannels,
						afkChannelText: message.guild.afkChannelID
							? args.t(LanguageKeys.Commands.Management.GuildInfoChannelsAfkChannelText, {
									afkChannel: message.guild.afkChannelID,
									afkTime: message.guild.afkTimeout / 60
							  })
							: `**${args.t(LanguageKeys.Globals.None)}**`
					}),
					true
				)
				.addField(
					serverInfoTitles.OTHER,
					args.t(LanguageKeys.Commands.Management.GuildInfoOther, {
						size: message.guild.roles.cache.size,
						region: message.guild.region,
						createdAt: message.guild.createdTimestamp,
						verificationLevel: message.guild.verificationLevel
					})
				)
		);
	}
}
