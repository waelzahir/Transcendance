import { useContext } from "react";
import { member } from "../../../types/room";
import {
	AdminButton,
	BanButton,
	DeleteRoom,
	KickButton,
	LeaveButton,
	MuteButton,
	OwnershipButton,
} from "../settingsAux/roomButtons";
import { SocketContext } from "../../Context/SocketContext";
import AdminSvg from "../../../assets/admin.svg";
import Ownersvg from "../../../assets/owner.svg";
import Normalsvg from "../../../assets/normal.svg";

import { Link } from "react-router-dom";

export const filter = (str: string) => {
	if (str === "admin") return AdminSvg;
	if (str === "owner") return Ownersvg;
	if (str === "participation") return Normalsvg;
	return str;
};

export const RoomsettingItem = ({
	returnf,
	user,
	roomid,
	userPerm,
}: {
	returnf: any;
	user: member;
	roomid: number;
	userPerm: member | undefined;
}) => {
	var more;
	const socket = useContext(SocketContext);

	if (userPerm?.permission === "participation")
		more = (
			<div className="flex flex-row">
				{userPerm.user_id.id === user.user_id.id ? (
					<LeaveButton returnf={returnf} socket={socket} room={roomid} roomuser={user} />
				) : (
					<></>
				)}
			</div>
		);
	if (userPerm?.permission === "owner") {
		more = (
			<div className="flex flex-row">
				{user.permission === "participation" ? (
					<>
						<KickButton socket={socket} room={roomid} roomuser={user} />
						<BanButton socket={socket} room={roomid} roomuser={user} />
						<MuteButton socket={socket} room={roomid} roomuser={user} />
						<AdminButton socket={socket} room={roomid} roomuser={user} />
						<OwnershipButton socket={socket} room={roomid} roomuser={user} />
					</>
				) : user.permission === "admin" ? (
					<>
						<AdminButton socket={socket} room={roomid} roomuser={user} />
						<OwnershipButton socket={socket} room={roomid} roomuser={user} />
					</>
				) : (
					<DeleteRoom returnf={returnf} socket={socket} room={roomid} />
				)}
			</div>
		);
	}
	if (userPerm?.permission === "admin")
		more = (
			<div className="flex flex-row">
				{user.permission === "participation" ? (
					<>
						<KickButton socket={socket} room={roomid} roomuser={user} />
						<BanButton socket={socket} room={roomid} roomuser={user} />
						<MuteButton socket={socket} room={roomid} roomuser={user} />
					</>
				) : user.permission === "admin" && user.user_id.id === userPerm.user_id.id ? (
					<>
						<AdminButton socket={socket} room={roomid} roomuser={user} />
					</>
				) : (
					<></>
				)}
			</div>
		);

	return (
		<div className="flex flex-row border-solid border-2 p-3 gap-y-4">
			<div className=" flex flex-col items-center">
			<Link to={`/profile/${user.user_id.nickname}`}>
				<img alt="avatar" className="border-solid border-2 max-h-[75px] max-w-[75px]" src={user?.user_id.avatar}></img>
				<h1 className="m-x">{user.user_id.nickname}</h1>
			</Link>
			</div>

			<div className="flex flex-row  justify-between  m-5 w-full h-full">
				<div>
					<img alt="permission" className="h-[50px] w-[50px]" src={filter(user.permission)}></img>
				</div>
				<div>{more}</div>
			</div>
		</div>
	);
};

