import { Command } from '../../../index';

export default class extends Command {

	public constructor(client: Client, store: CommandStore, file: string[], directory: string) {
		super(client, store, file, directory, {
			bucket: 2,
			cooldown: 10,
			description: (language) => language.get('COMMAND_SETMESSAGELOGS_DESCRIPTION'),
			extendedHelp: (language) => language.get('COMMAND_SETMESSAGELOGS_EXTENDED'),
			permissionLevel: 6,
			runIn: ['text'],
			usage: '<here|channel:channel>'
		});
	}

	public async run(msg, [channel]) {
		if (channel === 'here') ({ channel } = msg);
		else if (channel.type !== 'text') throw msg.language.get('CONFIGURATION_TEXTCHANNEL_REQUIRED');
		if (msg.guild.settings.channels.messagelogs === channel.id) throw msg.language.get('CONFIGURATION_EQUALS');
		await msg.guild.settings.update('channels.messagelogs', channel);
		return msg.sendLocale('COMMAND_SETMESSAGELOGS_SET', [channel]);
	}

}