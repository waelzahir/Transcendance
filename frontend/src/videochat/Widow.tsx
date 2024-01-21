import { useEffect, useState, useRef } from "react"
import { Socket, io } from "socket.io-client";
import IUser from "../types/User"
import { ip } from "../network/ipaddr"
import { toast } from "react-toastify"
import { AnimatedElement } from "../components/game/GameSetup";
import { Stream } from "stream";



// const socket: Socket = io(`wss://${ip}3001/hanan`, { autoConnect: false, transports: ["websocket"] });

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
    const outgoing = useRef<HTMLVideoElement>(null)
    const incoming = useRef(null)

  
    useEffect(() =>
    {

        // setInterval(async () => {
        //     const res = await fetch("")
        //     if (res.ok)
        //         setOnline(await res.json())
        // }, 5000)
        const   getMedia  = async () => 
        {
            // const devices = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === "videoinput")
            const constraints = {
                'video': true,
                'audio': true
            }
            const stream =  await navigator.mediaDevices.getUserMedia(constraints)
            if (outgoing.current)
             outgoing.current.srcObject = stream

        }
        getMedia()
    },[])
    let userlist;
    if (online)
        userlist = online.map((user) =>  <UserComponent key={user} id={user}/> )
    return (
            <div className="flex-row  w-full h-full bg-slate-600 ">
            
                <Header/>
                <div className="h-[90%] flex   border-solid border-2 border-white">
                        <div className="h-full flex-row overflow-y-auto w-2/12 border-solid border-2 gap-y-4">
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
        
                        <div className=" flex flex-col w-full h-full items-center justify-center  gap-y-8">
                             
                                <video ref={outgoing}  width="1024" height="900"  autoPlay ></video> 
                      
                            {/* <video  className="bg-white" width="854" height="480"></video> */}
                        </div>
                </div>
                <Footer reff={outgoing.current}/>
            </div>
        )
}
const Header = () =>
{
    return (
        <div className="w-full h-[5%] bg-black flex flex-col justify-center items-center">
            <h1 className="text-white text-center"> mamak </h1>
        </div>
    )
}

const Footer = ({reff} : {reff:any}) => 
{
    return (
        <div className="w-full h-[5%] bg-black flex flex-col justify-center items-center">
        <h1 className="text-white text-center" onClick={async () => {
          
          
        }}> babak </h1>
    </div>
    )
}