import { SubscribeMessage, WebSocketGateway,WebSocketServer } from '@nestjs/websockets';
import { Server , Socket} from "socket.io";

@WebSocketGateway({namespace: "hanan"})
export class VidchatGateway {

  constructor()
  {
    this.ids = new Map()
  }
  @WebSocketServer()
	server :Server;
  ids: Map<string, string>

  async handleConnection(client)
  {
    
    this.ids.set(client.id, Date.now().toString() )
    console.log(this.ids)
    client.emit("MYID", this.ids.get(client.id))
    this.server.except(client.id).emit("ONLINE", this.ids.get(client.id))
    
  }

  async handleDisconnect(client) {
    console.log("disconected")
    this.ids.delete(client.id)
    console.log(this.ids)
    client.emit("MYID", this.ids.get(client.id))
    this.server.except(client.identifierd).emit("OFFLINE", this.ids.get(client.id))
  }
  
  @SubscribeMessage('')
  handleMessage(client: any, payload: any) {

    client.emit("")
  }
}
