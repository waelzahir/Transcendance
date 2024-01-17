import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VidchatService {
    constructor(private readonly prisma: PrismaService )
    {

    }
    async getOnline(id : number)
    {
        return (await this.prisma.user.findUnique({
            where:{
                id: id,
                friendship1: {
                    some:{
                        status: 'DEFAULT'
                    }
                },
                friendship2: {
                    some:{
                        status: 'DEFAULT'
                    }
                },
            },
            select:{
                friendship1: {
                    select:
                    {
                       reciever_id:{
                            select:{
                                id: true,
                                nickname: true,
                                avatar:true,
                                user42:true,
                                connection_state: true,
                            }
                       }
                        
                    }
                },
                friendship2: {
                    select:
                    {
                       initiator_id:{
                            select:{
                                id: true,
                                nickname: true,
                                avatar:true,
                                user42:true,
                                connection_state: true
                            }
                       }
                        
                    }
                }
            }
        }))
    }
}
