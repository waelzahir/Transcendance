import { useEffect, useState } from "react"
import IUser from "../types/User"
import { ip } from "../network/ipaddr"
import { toast } from "react-toastify"

export const Widow =() =>
{
    const [online , setOnline] = useState<IUser>()
    useEffect(() =>
    {
        fetch("http://" + ip + "3001/widow").then(async res => 
        {

            if (res.ok)
                setOnline(await res.json())
            else
                toast.error("widow service error");
        }
        )
    },[])
    
    console.log(online)
    return (<div>suck dick </div>)
}