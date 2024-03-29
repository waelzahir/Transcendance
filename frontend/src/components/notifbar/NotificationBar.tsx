import { useEffect, useState } from "react";
import { useContext } from "react";
import { ToggleButton } from "./ToggleButton";
import { HoverDiv } from "../Common";
import { CurrentUser, currentUser } from "../Context/AuthContext";
import profileplaceholder from "../../assets/profileplaceholder.png";
import NotificationItem from "./NotificationItem";
import { INotificaion, InviteType } from "../../types/NotificationItem";
import { toast } from "react-toastify";
import { ip } from "../../network/ipaddr";
import { SocketContext } from "../Context/SocketContext";

const useGetExperience = async (setxpdata: any) => {
	useEffect(() => {
		fetch(`http://${ip}3001/invite/exp`, {
			method: "GET",
			credentials: "include",
		})
			.then(async (res) => {
				if (res.ok)
					setxpdata(await res.json());
			})
			.catch((err) => {
				toast.error("Error getting experience points");
			});
	}, []);
};

const useInvites = (setNotification: any) => {
	useEffect(() => {
		const fetchData = async () => {
			fetch(`http://${ip}3001/invite`, { credentials: "include" })
				.then((data) => data.json())
				.then((data) => {
					if (Array.isArray(data)) setNotification(data);
				})
				.catch((e) => toast.error(e.message));
		};
		fetchData();
	}, []);
};

const NotificationBar = ({ toogle, settogle }: { toogle: number; settogle: any }) => {
	const [isOpen, seIsOpen] = useState(false);
	const [data, setxpdata] = useState<number>(0);
	const [notification, setNotification] = useState<INotificaion[] | null>(null);
	const socket = useContext(SocketContext);
	const [newAlert, setNewAlert] = useState(false);

	const toggleChatBar = () => {
		seIsOpen(!isOpen);
		if (!isOpen) settogle(2);
		else settogle(0);
		newAlert ? setNewAlert(!newAlert) : setNewAlert(newAlert);
	};
	const user: CurrentUser | null = useContext(currentUser);
	useInvites(setNotification);
	socket.off("INVITES").on("INVITES", (data: INotificaion) => {
		setNewAlert(true);
		if (!notification || !data) return;
		const newnotifstate = notification.slice();
		const index = newnotifstate.findIndex((not: INotificaion) => not.id === data.id);
		if (index === -1) newnotifstate.push(data);
		else newnotifstate[index].status = data.status;
		setNotification(newnotifstate);
	});
	useGetExperience(setxpdata);
	let invites;
	if (notification) invites = notification.map((ha, key) => <NotificationItem key={ha.id} notif={ha} />);
	return (
		<>
			{isOpen && <HoverDiv toggleChatBar={toggleChatBar} />}

			<ToggleButton isOpen={isOpen} isNewAlert={newAlert} setIsOpen={toggleChatBar} />

			<div
				className={`fixed inset-y-0 right-0 bg-background border-l-2 border-solid 
			sm:w-[85%] md:w-1/2 lg:w-1/2 xl:w-[35%] 2xl:w-[30%] w-[90%] transition-all duration-300
			font-pixelify z-50
			${isOpen ? "transform translate-x-0" : "transform translate-x-full"}`}
			>
				<div className={`flex flex-col gap-2 h-full max-h-full min-h-full p-1 divide-x`}>
					<div
						className={`grid grid-cols-10 gap-1 p-1 h-[92px] min-h-[92px] content-evenly
					cursor-pointer`}
					>
						<div className={`col-span-2`}>
							<img
								className={`border-2 border-solid border-textColor w-[72px] min-w-[72px] min-h-[72px] h-[72px]`}
								src={`${!user ? profileplaceholder : user.avatar}`}
								alt=""
							/>
						</div>
						<div className={`col-span-4 gap-2 p-2`}>
							<h2 className={`text-primary font-pixelify font-bold text-lg`}>
								{user ? user.nickname : "Loading..."}
							</h2>
						</div>

						<div className="col-span-2 flex items-center justify-center h-full">
							<p>level {data ? data.toString().length : "0"} </p>
						</div>
						<div className="col-span-2 flex items-center justify-center h-full">
							<p>exp {data}</p>
						</div>
					</div>
					<hr className="my-1 h-0.5 border-t-0 bg-textColor opacity-100" />

					<div className={`flex flex-col flex-1 py-3 min-h-[100px] gap-2 px-2 sm:px-3 overflow-y-scroll`}>
						{invites}
					</div>
				</div>
			</div>
		</>
	);
};

export default NotificationBar;
