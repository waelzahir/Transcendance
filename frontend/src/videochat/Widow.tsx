import { useEffect, useState, useRef } from "react"
import { Socket, io } from "socket.io-client";
import IUser from "../types/User"
import { ip } from "../network/ipaddr"
import { toast } from "react-toastify"
import { AnimatedElement } from "../components/game/GameSetup";



const socket: Socket = io(`ws://${ip}3001/hanan`, { autoConnect: false, transports: ["websocket"] });

const UserComponent = ({id}: {id :string}) =>
{
    
    return (
        <div className={`${id === "me" ? "bg-white" : ""} h-36 border-solid border-2  flex justify-around`}>
            <div className="flex justify-center items-center m-auto">
                <img className="h-[100px] w-[100px] rounded-full" src="https://picsum.photos/200/300"></img>
            </div>
                <div className="flex-row justify-center m-auto">
                    <h1 className="text-center">id {id}</h1>
                    <h1 className="text-center" >nickname</h1>
                    <h1 className="text-center" >username</h1>
                    {
                        id === "me" ?
                        null
                        :
                        <button className="rounded-full border-2 border-solid bg-green-600 w-[50px] h-[50px]" onClick={() => {alert(id)}}>  </button>
                    }
                </div>
        </div>
    )
}

export const Widow =() =>
{
    const [online , setOnline] = useState<string[]>([])
    const [me, setme] = useState<string>("")
    const [incall, setincall] = useState(false);
    const outgoing = useRef()
    const incoming = useRef()

    useEffect(() =>
    {
        socket.connect();
        socket.on("MYID",  (data) => setme(data))
        socket.on("ONLINE", (data) => {
            const ndata = online.slice()
            ndata.unshift(data)
            setOnline(ndata)
        })
        socket.on("OFFLINE", (data) => {
            const ndata = online.filter(nd =>  nd != data)
            setOnline(ndata)
        })
        return () =>{
            socket.off("MYID")
            socket.off("ONLINE")
            socket.off("OFFLINE")
            socket.disconnect()
        }
    },[])
    let userlist;
    if (online)
        userlist = online.map((user) =>  <UserComponent key={user} id={user}/> )
    return (
            <div className="flex justify-between w-full h-full bg-slate-600 m-auto">
            
                <div className=" flex-row overflow-y-auto w-2/12 border-solid border-2 gap-y-4">
                        <UserComponent id="me"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                        <UserComponent id="mamak"/>
                </div>
                {
                    incall ? 
                    <div className="flex justify-center  items-center gap-x-4 m-auto">
                        <video className="bg-black" width="854" height="480"></video>
                       <video  className="bg-white" width="854" height="480"></video>
                </div>
                :
                <AnimatedElement />
                }
            </div>
        )
}