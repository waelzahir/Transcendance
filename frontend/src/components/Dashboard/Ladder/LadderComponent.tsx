import Contestant from "./LadderContestant";

export default function Global({ Ladder, LadderTitle }: { Ladder: any; LadderTitle: any }) {
	return (
		<div className="max-w-[1536px] m-4 sm:m-8 p-5 sm:p-10 border-solid border-4 h-[60rem] Ft shadow-[2px_4px_0px_0px_#000301] 2xl:w-[50%]">
			<h1 className="truncate text-xs sm:text-lg lg:text-2xl xl:text-3xl text-center font-Nova font-black mb-1 border-solid border-4 p-2 sm:p-6 bg-white shadow-[2px_4px_0px_0px_#000301]">
				{LadderTitle}
			</h1>
			<div className="rr overflow-y-auto h-[48rem] FF cursor-row-resize">
				{Ladder.map((index: any, i:number) => (
					<Contestant key={i} Name={index?.nickname} score={index?.experience_points} pic={index?.avatar} />
				))}
			</div>
		</div>
	);
}
