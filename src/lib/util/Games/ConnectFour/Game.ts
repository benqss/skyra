import { Board } from './Board';
import { KlasaMessage } from 'klasa';
import { DiscordAPIError, Permissions, TextChannel } from 'discord.js';
import { Events } from '../../../types/Enums';
import { Player } from './Player';
import { LongLivingReactionCollector } from '../../LongLivingReactionCollector';
import { CONNECT_FOUR } from '../../constants';

export class Game {

	public readonly board: Board;
	public message: KlasaMessage;
	public players: readonly [Player, Player];
	public winner: Player | null;
	public llrc: LongLivingReactionCollector | null;

	public constructor(message: KlasaMessage) {
		this.board = new Board();
		this.message = message;
		this.players = [null, null];
		this.winner = null;
		this.llrc = null;
	}

	public setPlayers(players: [Player, Player]) {
		this.players = players;
	}

	public get language() {
		return this.message.language;
	}

	public set content(value: string) {
		this._content = value;
		this.updateContent();
	}

	public get content() {
		return this._content;
	}

	private _turnLeft: boolean = Math.round(Math.random()) === 0;
	private _content: string = '';
	private _retries: number = 3;
	private _stopped: boolean = false;

	public get next() {
		return this.players[this._turnLeft ? 1 : 0];
	}

	public get running() {
		return !this.winner && !this._stopped;
	}

	/**
	 * Whether Skyra has the MANAGE_MESSAGES permission or not
	 */
	public get manageMessages(): boolean {
		const message = this.message;
		return (message.channel as TextChannel).permissionsFor(message.guild.me).has(Permissions.FLAGS.MANAGE_MESSAGES);
	}

	public stop() {
		this._stopped = true;
	}

	public async run() {
		this.message = await this.message.send(this.language.get('SYSTEM_LOADING')) as KlasaMessage;
		for (const reaction of CONNECT_FOUR.REACTIONS) await this.message.react(reaction);
		this.content = this.language.get('COMMAND_C4_GAME_NEXT', this.next.name, this.next.color);
		this.llrc = new LongLivingReactionCollector(this.message.client);

		let stop = false;
		while (!stop) {
			const player = this.next;
			await player.start();
			if (!(stop = !this.running)) this._turnLeft = !this._turnLeft;
			await player.finish();
		}

		if (!this.message.deleted && this.manageMessages) {
			await this.message.reactions.removeAll().catch(err => this.message.client.emit(Events.ApiError, err));
		}
	}

	private async updateContent() {
		try {
			await this.message.edit(`${this.content}\n${this.board.render()}`);
			this._retries = 3;
		} catch (error) {
			if (error instanceof DiscordAPIError && (error.code === 10003 || error.code === 10008)) {
				this.message.alert(this.message.language.get('COMMAND_C4_GAME_DRAW'));
				this.stop();
			} else {
				this.message.client.emit(Events.Wtf, error);
				if (--this._retries === 0) return this.stop();
			}
		}
	}

}
