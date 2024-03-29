import { room } from "../../types/room";
import { messages } from "../../types/messages";

const GroupItem = ({ selector, room, glimpse }: { selector: any; room: room; glimpse: messages[] }) => {
	let preview;
	preview = "Start the conversation";
	if (Array.isArray(glimpse) && glimpse.length === 1)
		preview = glimpse[0].messages.length > 25 ? glimpse[0].messages.substring(0, 25) : glimpse[0].messages;
	const name = room.name.length > 15 ? room.name.substring(0, 15) : room.name;
	return (
		<div className="flex flex-row mx-2 gap-3 p-2 shadow-buttonShadow rounded border-solid border-textColor border-2">
			<div className=" w-1/6 justify-center rounded">
			<img alt="room" className=" shadow-buttonShadow max-h-[75px] max-w-[75px]" src={`https://fakeimg.pl/600x600?text=${"@ "+name.substring(0, 5)}`} ></img>

			</div>
			<div onClick={selector} className="flex flex-col flex-auto cursor-pointer gap-2 ">
				<p className=" text-center  text-ellipsis overflow-hidden text-primary text-xl">{name}</p>
				<p className="text-ellipsis text-center overflow-hidden">{preview}</p>
			</div>
		</div>
	);
};

export default GroupItem;
