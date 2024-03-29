import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { AtGuard } from './common/guards';
import { Req, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common';
import { GetCurrentUser, GetCurrentUserId } from './common/decorators';
import { PrismaService } from './prisma/prisma.service';
import { current_state, relationsip_status } from '@prisma/client';
import { Server , Socket} from "socket.io";
import { stat } from 'fs';
import { RoomGuard } from './common/guards/chat/RoomGuards.guard';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { use } from 'passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from "@nestjs/config";
import { Request } from 'express';
import { WsValidationExeption } from './filters/ws.exeption.filter';

const conf: ConfigService = new ConfigService();
@WebSocketGateway()
@UseGuards(RoomGuard)
@UseGuards(AtGuard)
@UseFilters(WsValidationExeption)
export class AppGateway {
 
  constructor(
		private readonly prisma: PrismaService,
		private statusnotify: EventEmitter2,
		private jwtServide : JwtService,
		
	) {
	}


	@WebSocketServer()
	server :Server;

	async welcome(client, user)
	{
		client.join(user["user42"])
		if ((await this.server.to(user["user42"]).fetchSockets()).length == 1)
		{
			const	state = await this.prisma.user.update({where:{user42:user["user42"],},data:{connection_state: current_state.ONLINE}});
			this.statusnotify.emit("PUSHSTATUS", state.user42 , [{ user42:state.user42 , connection_state: state.connection_state}])
		}
		
	}

 	async handleConnection(client ) {
		let user;
		 try
		 {
				user = (await this.jwtServide.verify(client.request.headers.cookie.match(/(?<=atToken=)(.*?)(?=;|$)/)[0] , {
					"secret" : conf.get('AT_SECRET')
				}))
				if (!user)
					throw new Error();
				this.welcome(client, user)
			}
			catch
			{
				try
				{
					user = (await this.jwtServide.verify(client.request.headers.cookie.match(/(?<=rtToken=)(.*?)(?=;|$)/)[0] , {
						"secret" : conf.get('RT_SECRET')
					}))
					if (!user)
						throw new Error();

					this.welcome(client, user)
				}
				catch
				{
					client.disconnect()
				}

				
			}
	}
	
	
	async handleDisconnect(client) {
		const identifier = client.request.headers["user"]
		if (identifier === undefined)
			return ;
		if (!(await this.server.to(identifier).fetchSockets()).length)
		{
			try
			{
				const	state = await this.prisma.user.update({where:{user42:identifier,},data:{connection_state: current_state.OFFLINE}});
				this.statusnotify.emit("PUSHSTATUS", state.user42 , [{ user42:state.user42 , connection_state: state.connection_state}])
			}
			catch
			{}
		}
	}	

	
	@SubscribeMessage("ONNSTATUS")
	async getPrimarystatus( @GetCurrentUser("user42") identifier:string, @ConnectedSocket() client)
	{
		try{
			
			const status = await this.prisma.user.findUnique(
				{
					where:{
						user42:identifier,
					},
					select:{
						friendship1: {
							
							select:{
								reciever_id:{
									select:
									{
										connection_state:true,
										user42:true,
									}
								},
								status:true,
							}
						},
						friendship2: {
							select:{
								initiator_id:{
									select:
									{
										connection_state:true,
										user42:true,
									}
								},
								status:true
							}
						}
					}
				}
				)
				const allstatus = [];
				status.friendship1?.map((friend) => {
					friend.status === "DEFAULT"?
					allstatus.push({user42: friend.reciever_id.user42, connection_state: friend.reciever_id.connection_state}):
					allstatus.push({user42: friend.reciever_id.user42, connection_state: "BLOCKED"})
					
				})
				status.friendship2?.map((friend) =>{
					friend.status === "DEFAULT"?
					allstatus.push({user42: friend.initiator_id.user42, connection_state: friend.initiator_id.connection_state}):
					allstatus.push({user42: friend.initiator_id.user42, connection_state: "BLOCKED"})
				})
				
				client.emit("ON_STATUS",   allstatus)
			}catch{}
	}
			
	@OnEvent('PUSHSTATUS')
	async notifyALL(user: string, status:[])
	{
		const friends = await this.getfriends(user);
		friends.forEach( async (friend) => 
		{
			if((await this.server.to(friend).fetchSockets()).length)
				this.server.to(friend).emit("ON_STATUS" , status);
		});
	}


	@OnEvent("PUSH")
	async informuser(user42, invite, type)
	{
		if ((await this.server.to(user42).fetchSockets()).length)
			this.server.to(user42).emit(type, invite);
	}
	async getfriends(user:string)
	{
		const friends = await this.prisma.friendship.findMany({
			where	:	{
				OR :
				[
					{
						initiator_id:{user42:user},
						status:relationsip_status.DEFAULT,
					},
					{
						reciever_id:{user42:user},
						status:relationsip_status.DEFAULT,
					},
					
				]
			},
			select:
			{
				initiator_id:
				{
					select:
					{
						user42:true,
					}
				},
				reciever_id:
				{
					select:
					{
						user42:true,
					}
				}
				
			}
		});
		const list = friends.map((frien) =>
		{
			if (frien.initiator_id.user42 == user)
				return frien.reciever_id.user42;
			return frien.initiator_id.user42
		})
		return list;
	}

	@OnEvent("AUTOUNMUTE")
	async inform(roomid, userstate)
	{
		this.server.to(roomid.toString()).emit("ACTION", {region: "ROOM", action:"update" , data: userstate})
	}

	@OnEvent("IN_GAME")
	async ingame(user1: number, user2: number) {
		const status = await this.prisma.user.updateMany({
			where:
			{
				OR:[
					{
						id:user1,
					},
					{
						id:user2,
					}
				],
			},
			data:{
				connection_state: 'IN_GAME'
			}
		})
		this.notifyupdate(user1)
		this.notifyupdate(user2)
	}

	@OnEvent("LEFT_GAME")
	async leftgame(user1: number, user2: number) {
		await this.prisma.user.updateMany({
			where:
			{
				OR:[
					{
						id:user1,
						connection_state: "IN_GAME",
					},
					{
						id:user2,
						connection_state: "IN_GAME"
					}
				],
			},
			data:{
				connection_state: 'ONLINE'
			}
		})
		this.notifyupdate(user1)
		this.notifyupdate(user2)
	}

	async notifyupdate(user: number)
	{
		const friends = await this.getidedfriends(user);
		const status = await this.prisma.user.findUnique({where:{id:user}, select:{user42:true, connection_state:true}})
		friends.forEach( async (friend) => 
		{
			if((await this.server.to(friend).fetchSockets()).length)
				this.server.to(friend).emit("ON_STATUS" , [status] );
		}
	);
	}
	async getidedfriends(user:number)
	{

		const friends = await this.prisma.friendship.findMany({
			where	:	{
				OR :
				[
					{
						initiator_id:{id:user},
						status:relationsip_status.DEFAULT,
					},
					{
						reciever_id:{id:user},
						status:relationsip_status.DEFAULT,
					},
					
				]
			},
			select:
			{
				initiator_id:
				{
					select:
					{
						id:true,
						user42:true,
					}
				},
				reciever_id:
				{
					select:
					{
						id:true,
						user42:true,
					}
				}
				
			}
		});
		const list = friends.map((frien) =>
		{
			if (frien.initiator_id.id == user)
				return frien.reciever_id.user42;
			return frien.initiator_id.user42
		})
		return list;
	}
	
}



/**
 * 
 * 	user conects: 
 * 		->>>>> userstatus set as online
 * 	user join a game:
 * 				-> userstatus as in game
 * 	user leaves a game:
 * 		->>> user status as offligne;
 * 
 * 
 */