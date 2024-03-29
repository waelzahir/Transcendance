import { UseFilters, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { AtGuard } from "src/common/guards";
import { PrismaService } from "src/prisma/prisma.service";
import { Server } from "socket.io";
import { GetCurrentUser, GetCurrentUserId } from "src/common/decorators";
import { RoomPermitions } from "src/common/decorators/RoomPermitions.decorator";
import { roomtype, user_permission } from "@prisma/client";
import { RoomType } from "src/common/decorators/RoomType.decorator";
import { ActionDTO } from "src/Dto/Action.dto";
import { ChatService } from "./chat.service";
import { RoomDto } from "src/Dto/rooms.dto";
import { RoomGuard } from "src/common/guards/chat/RoomGuards.guard";
import { RoomStatus } from "src/common/decorators/RoomStatus.deorator";
import { Roomstattypes } from "src/types.ts/statustype";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { WsValidationExeption } from "src/filters/ws.exeption.filter";

@WebSocketGateway({ transports: ["websocket"] })
@UsePipes(new ValidationPipe())
@UseGuards(RoomGuard)
@UseGuards(AtGuard)
@UseFilters(WsValidationExeption)
export class ChatGateway {
	constructor(
		private readonly prisma: PrismaService,
		private readonly service: ChatService,
	) {}

	@WebSocketServer()
	server: Server;

	@SubscribeMessage("ROOMSUBSCRIBE")
	@RoomPermitions(user_permission.owner, user_permission.admin, user_permission.participation, user_permission.chat)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public, roomtype.chat)
	@RoomStatus(Roomstattypes.NOTBAN, Roomstattypes.NOTBLOCK)
	async subscribeRoom(
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() room: { room: number },
	) {
		client.join(room.room.toString());
	}
	
	@SubscribeMessage("CREATE")
	async createroom(
		@GetCurrentUser("user42") identifier: string,
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() room: RoomDto,
	) {
		try {
			const newroom = await this.service.rooms.create_room(id, room);
			this.server.to(identifier).emit("ACTION", { region: "ROOM", action: "NEW", data: newroom });
		} catch {
			client.emit("ChatError", "Error creating room");
		}
	}

	@SubscribeMessage("JOIN")
	@RoomType(roomtype.public, roomtype.protected)
	async joinroom(
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() room: RoomDto,
		@GetCurrentUser("user42") identifier: string,
	) {
		try {
			const newroom = await this.service.rooms.join_room(id, room.room, room);
			if (newroom) {
				this.server.to(identifier).emit("ACTION", { region: "ROOM", action: "JOIN", data: newroom });
				this.server.to(room.room.toString()).emit("ACTION", { region: "ROOM", action: "JOIN", data: newroom });

				this.server.to(room.room.toString()).emit("NOTIFY", ` ${identifier} joined ${newroom.name}`);
			} else {
				throw new Error("user probably in room");
			}
		} catch (e) {
			client.emit("ChatError", " join error");
		}
	}

	@SubscribeMessage("MOD")
	@RoomPermitions(user_permission.owner)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async modify(@GetCurrentUserId() id: number, @ConnectedSocket() client, @MessageBody() room: RoomDto) {
		try {
			const newroom = await this.service.rooms.modify_room(id, room.room, room);
			this.server.to(room.room.toString()).emit("ACTION", { region: "ROOM", action: "MOD", data: newroom });
			this.server.to(room.room.toString()).emit("NOTIFY", `room ${newroom.name} setting are changed `);
		} catch (e) {
			client.emit("ChatError", " mod error");
		}
	}

	/********************** */
	@SubscribeMessage("CHAT")
	@RoomPermitions(user_permission.owner, user_permission.admin, user_permission.participation, user_permission.chat)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public, roomtype.chat)
	@RoomStatus(Roomstattypes.NOTBAN, Roomstattypes.NOTBLOCK, Roomstattypes.NOTMUTE)
	async onMessage(@GetCurrentUserId() id: number, @ConnectedSocket() client, @MessageBody() message: ActionDTO) {
		const res = await this.service.messages.send_message(id, message.room, message.What);
		if (!res) {
			client.emit("ChatError", "failed to send message");
			return;
		}
		const blocked = (
			await this.prisma.friendship.findMany({
				where: {
					status: {
						not: "DEFAULT",
					},
					OR: [
						{
							initiator: id,
						},
						{
							reciever: id,
						},
					],
				},
			})
		).map((blockrel) => (blockrel.initiator === id ? blockrel.reciever : blockrel.initiator));

		const memes = (
			await this.prisma.rooms_members.findMany({
				where: {
					roomid: message.room,
					isBanned: false,
				},
				select: {
					user_id: {
						select: {
							id: true,
							user42: true,
						},
					},
				},
			})
		).filter((mem) => !blocked.includes(mem.user_id.id));

		memes.map(async (memeber) => {
			if ((await this.server.to(memeber.user_id.user42).fetchSockets()).length)
				this.server.to(memeber.user_id.user42).emit("ACTION", { region: "CHAT", action: "NEW", data: res });
		});
	}

	@SubscribeMessage("BLOCK")
	@RoomPermitions(user_permission.chat)
	@RoomType(roomtype.chat)
	async block(
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
		@GetCurrentUser("user42") identifier: string,
	) {
		let res;
		if (Message.What === "BLOCK") res = await this.service.rooms.block_user(id, Message.target, Message.room);
		if (Message.What === "UNBLOCK") {
			res = await this.service.rooms.unblock_user(id, Message.target, Message.room);
		}
		if (typeof res === "string") {
			this.server.to(identifier).emit("ChatError", res);
			return;
		}
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}

		const meindex = identifier === res[1].user_id.user42 ? 0 : 1;
		const toindex = identifier === res[1].user_id.user42 ? 1 : 0;
		const mesituation = res[0].isblocked ? "BLOCKED" : res[meindex].user_id.connection_state;
		const tosituation = res[0].isblocked ? "BLOCKED" : res[toindex].user_id.connection_state;

		this.server
			.to(res[meindex].user_id.user42)
			.emit("ON_STATUS", [{ user42: res[toindex].user_id.user42, connection_state: tosituation }]);
		this.server
			.to(res[toindex].user_id.user42)
			.emit("ON_STATUS", [{ user42: res[meindex].user_id.user42, connection_state: mesituation }]);
		this.server
			.to(res[meindex].user_id.user42)
			.emit("ACTION", { region: "ROOM", action: "update", data: res[toindex] });
		this.server
			.to(res[toindex].user_id.user42)
			.emit("ACTION", { region: "ROOM", action: "update", data: res[meindex] });
	}

	@SubscribeMessage("KICK")
	@RoomPermitions(user_permission.admin, user_permission.owner)
	@RoomType(roomtype.protected, roomtype.public, roomtype.private)
	async kick(
		@GetCurrentUserId() id: number,
		@GetCurrentUser("user42") identifier: string,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {
		const res = await this.service.rooms.kick_room(Message.target, Message.room);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "KICK", data: res });
		this.server.to(Message.room.toString()).emit("NOTIFY", ` ${identifier} kicked ${res.user_id.nickname}`);
		/**
		 * delete user from th room
		 */
		this.server.sockets.adapter.rooms
			.get(res.user_id.user42)
			.forEach((client) => this.server.sockets.sockets.get(client).leave(Message.room.toString()));
	}

	@SubscribeMessage("BAN")
	@RoomPermitions(user_permission.owner, user_permission.admin)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async ban(
		@GetCurrentUserId() id: number,
		@GetCurrentUser("user42") identifier,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {
		let res;
		if (Message.What === "BAN") {
			res = await this.service.rooms.ban_user(Message.target, Message.room);
		}
		if (Message.What === "UNBAN") {
			res = await this.service.rooms.unban_user(Message.target, Message.room);
			this.server.sockets.adapter.rooms
				.get(identifier)
				.forEach((client) => this.server.sockets.sockets.get(client).join(Message.room.toString()));
		}
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "update", data: res });
		this.server
			.to(Message.room.toString())
			.emit("NOTIFY", ` ${identifier} did  ${Message.What} ${res.user_id.nickname}`);
		if (Message.What === "UNBAN") return;
		this.server.sockets.adapter.rooms
			.get(identifier)
			.forEach((client) => this.server.sockets.sockets.get(client).leave(Message.room.toString()));
	}

	@SubscribeMessage("MUTE")
	@RoomPermitions(user_permission.owner, user_permission.admin)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async mute(
		@GetCurrentUserId() id: number,
		@GetCurrentUser("user42") identifier,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {
		let res;
		if (Message.What === "MUTE") res = await this.service.rooms.mute_user(Message.target, Message.room);
		if (Message.What === "UNMUTE") res = await this.service.rooms.unmute_user(Message.target, Message.room);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "update", data: res });
		this.server.to(Message.room.toString()).emit("NOTIFY", ` ${identifier} muted ${res.user_id.nickname}`);
	}

	@SubscribeMessage("LWERT")
	@RoomPermitions(user_permission.owner)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async lwart(@GetCurrentUserId() id: number, @ConnectedSocket() client, @MessageBody() Message: ActionDTO) {
		const res = await this.service.rooms.giveOwnership(id, Message.room, Message.target);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);

			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "update", data: res[0] });
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "update", data: res[1] });
	}

	@SubscribeMessage("INDIWANA")
	@RoomPermitions(user_permission.owner)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async indiwana(
		@GetCurrentUser("user42") identifier,
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {

		const res = await this.service.rooms.give_room_admin(Message.room, Message.target);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "update", data: res });
		this.server
			.to(Message.room.toString())
			.emit("NOTIFY", ` ${res.user_id.nickname} in an Admin for ${res.rooms.name}`);
	}

	@SubscribeMessage("OUTDIWANA")
	@RoomPermitions(user_permission.owner, user_permission.admin)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async outdiwana(
		@GetCurrentUser("user42") identifier,
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {

		const res = await this.service.rooms.revoke_room_admin(Message.room, Message.target);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "update", data: res });
		this.server.to(Message.room.toString()).emit("NOTIFY", ` ${identifier}  not an - room  ${res.rooms.name}`);
	}

	@SubscribeMessage("LEAVE")
	@RoomPermitions(user_permission.admin, user_permission.participation)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async leaveroom(
		@GetCurrentUserId() id: number,
		@GetCurrentUser("user42") identifier,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {
		const res = await this.service.rooms.leave_room(id, Message.room);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "KICK", data: res });
		this.server.to(Message.room.toString()).emit("NOTIFY", ` ${identifier} left  ${res.rooms.name}`);
		this.server.sockets.adapter.rooms
			.get(identifier)
			.forEach((client) => this.server.sockets.sockets.get(client).leave(Message.room.toString()));
	}

	@SubscribeMessage("DELETE")
	@RoomPermitions(user_permission.owner)
	@RoomType(roomtype.private, roomtype.protected, roomtype.public)
	async deleteroom(@GetCurrentUserId() id: number, @ConnectedSocket() client, @MessageBody() Message: ActionDTO) {

		const res = await this.service.rooms.delete_room(Message.room);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(Message.room.toString()).emit("ACTION", { region: "ROOM", action: "DELETE", data: res });
		this.server.to(Message.room.toString()).emit("NOTIFY", `Room: ${res.name} is deleted`);

		this.server.in(Message.room.toString()).socketsLeave(Message.room.toString());
	}

	@SubscribeMessage("INVITEROOM")
	@RoomType(roomtype.private)
	@RoomStatus(Roomstattypes.NOTBAN)
	async inviteroom(
		@GetCurrentUser("user42") identifier,
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {
		const friend = await this.prisma.user.findUnique({
			where: {
				nickname: Message.What,
			},
		});
		if (!friend) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		const friendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ initiator: id, reciever: friend.id },
					{ initiator: friend.id, reciever: id },
				],
			},
		});
		const res = await this.service.rooms.invite_room(id, friend.id, Message.room);
		if (!res) {
			client.emit("ChatError", `failed to ${Message.What}`);
			return;
		}
		this.server.to(res.reciever_id.user42).emit("INVITES", res);
		this.server.to(res.issuer_id.user42).emit("INVITES", res);
		this.server
			.to(res.room_id.id.toString())
			.emit(
				"NOTIFY",
				`User ${res.issuer_id.nickname} invited ${res.reciever_id.nickname} to room ${res.room_id.name}`,
			);
	}

	@SubscribeMessage("ROOMACTION")
	async roomaction(
		@GetCurrentUser("user42") identifier,
		@GetCurrentUserId() id: number,
		@ConnectedSocket() client,
		@MessageBody() Message: ActionDTO,
	) {
		let res;
		if (Message.What == "ok") {
			res = await this.service.rooms.acceptinviteRoom(Message.target, id);
		}
		if (Message.What == "no") res = await this.service.rooms.rejectroominvite(Message.target, id);
		if (!res) {
			client.emit("ChatError", "mamak");
			return;
		}
		if (Message.What == "no") {
			this.server.to(res.issuer_id.user42).emit("INVITES", res);
			this.server.to(res.reciever_id.user42).emit("INVITES", res);
			return;
		}
		this.server.to(res[0].issuer_id.user42).emit("INVITES", res[0]);
		this.server.to(res[0].reciever_id.user42).emit("INVITES", res[0]);
		if (Message.What == "ok")
			this.server
				.to(res[0].reciever_id.user42)
				.emit("ACTION", { region: "ROOM", action: "JOIN", data: res[1].rooms });
	}
}
