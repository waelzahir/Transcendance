import { HttpCode, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { count } from "console";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class MessagesService {
	constructor(private readonly prisma: PrismaService) {}
	async send_message(pid, rid, message: string) {
		const membership = await this.prisma.rooms_members.findFirst({
			where: { AND: [{ roomid: Number(rid) }, { userid: Number(pid) }] },
		});
		if (!membership || membership.isblocked || membership.ismuted)
			throw new HttpException("cant send message", 403);
		if (!message.length) throw new HttpException("Not Acceptable", 406);
		const msg = await this.prisma.messages.create({
			data: {
				room_id: Number(rid),
				sender_id: Number(pid),
				messages: message,
			},
		});
		return msg;
	}
	async get_messages(pid, rid) {
		const membership = await this.prisma.rooms_members.findFirst({
			where: { AND: [{ roomid: Number(rid) }, { userid: Number(pid) }] },
		});
		if (!membership || membership.isblocked) throw new HttpException("Unauthorized", 401);
		const conversation = await this.prisma.messages.findMany({
			where: {
				room_id: rid,
			},
			select: {
				senderid: {
					select: {
						id:true,
						avatar: true,
						nickname: true,
					},
				},
				created_at: true,
				messages: true,
			},
		});
		console.log(conversation);
		return conversation;
	}
	async get_rooms(id: number) {
		try {
			const data = await this.prisma.rooms_members.findMany({
				where: {
					userid: id,
				},
				select: {
					rooms: {
						select: {
							id: true,
							name: true,
							roomtypeof: true,
							created_at: true,
							rooms_members: {
								where: {
									id: {
										not: id,
									},
								},
								select: {
									user_id: {
										select: {
											avatar: true,
											user42: true,
											nickname: true,
										},
									},
								},
							},
						},
					},
				},
			});
			return data;
		} catch {
			throw new HttpException("Database error", HttpStatus.NOT_FOUND);
		}
	}
}