import FeatureBlock from "../HomePage/FeaturesBlocComponent";
import friendStarts from "../../assets/chatStars.png";
import Ui from "../../assets/UX.png";
import gameController from "../../assets/GameController.png";
import startGame from "../../assets/StartGame.png";
import Overview from "../../assets/Overview.png";
import StaySafe from "../../assets/StaySafe.png";
import Spliter from "../Spliter";

export default function FeaturesBloc() {
	return (
		<div id="about">
			<Spliter title="FEATURES" />
			<div className="BigDiv gap-16 max-w-[1536px] lg:px-4 min-[1051px]:flex lg:flex min-[0px]:mx-5 2xl:m-auto">
				<div className="leftDiv flex-col min-[0px]:w-[85%] sm:w-[75%] min-[730px]:w-[70%] m-auto p-8">
					<FeatureBlock
						Color={"bg-sucessColor"}
						Pic={Overview}
						FeatureTitle="OVERVIEW"
						text="Our website offers an enjoyable Pong gaming experience with real-time multiplayer features, a friendly chat interface, and a user-friendly design. To guarantee a seamless experience, we've leveraged cutting-edge technologies for the website's functionality and user interface. Our goal is to keep everything current, using the latest tools and resources available. Your information is securely stored in a reliable system, and our website is a one-page platform, ensuring easy navigation with your browser's buttons. It's designed to work well with the most recent version of Google Chrome and one other web browser of your choice. We've taken extra care to eliminate any unexpected errors, making your visit smooth and trouble-free. Enjoy your gaming!"
					/>
					<FeatureBlock
						Color={"bg-secondary"}
						Pic={friendStarts}
						FeatureTitle="NEW FRIENDS"
						text="We've taken chat to a whole new level with some exciting features. You can create your own chat rooms, which can be public, private, or password-protected – it's your choice. For more personal conversations you can send direct messages to specific users. In the spirit of gaming, you can invite others to play Pong right from the chat interface. And, for a more in-depth experience, you can access other players' profiles directly through the chat, making it even easier to connect with fellow gamers."
					/>
					<FeatureBlock
						Color={"bg-errorColor"}
						Pic={StaySafe}
						FeatureTitle="STAY SAFE!"
						text="To make our website both functional and secure, we've taken several key steps. First, we've ensured the safety of your login credentials. Any passwords you use on our website are encrypted, providing an extra layer of protection. Additionally, our website is shielded against potential threats from SQL injections. We've put in place safeguards to prevent malicious code from infiltrating our system through user inputs. We've also implemented server-side validation, an essential security measure. This helps to keep your data clean and secure, minimizing potential vulnerabilities. Lastly, we employ a robust password encryption method, further fortifying the protection of your personal information. Your online safety is a top priority for us!"
					/>
				</div>
				<div className="RightDiv flex flex-col  min-[0px]:w-[85%] sm:w-[75%] min-[730px]:w-[70%] m-auto p-8">
					<FeatureBlock
						Color={"bg-primary"}
						Pic={Ui}
						FeatureTitle="USER EXPERIENCE"
						text="Our website is equipped with some cool functionalities to enhance your experience. To get started, you can log in using the secure OAuth system of 42 intranet. Once you're in, you have the freedom to choose a unique name to be displayed on the website, and you can personalize your profile by uploading an avatar. Building connections is easy here; you can add other users as friends and see their current status, whether they're online, offline, or in a game. You can also keep track of your gaming journey by displaying stats on your user profile. This includes information like your wins and losses, ladder level, and achievements. For those who are curious about their past games, there's a Match History section that covers 1v1 games, ladder matches, and other relevant information. Security is a priority, so you can enable two-factor authentication for added protection. You can choose to use Google Authenticator or receive a text message on your phone for this purpose."
					/>
					<FeatureBlock
						Color={"bg-buttonColor"}
						Pic={gameController}
						FeatureTitle="NOSTALGIA"
						text="this website invites you to journey back in time to the 90s, relishing the nostalgic thrill of the ping-pong game. Our main objective here is to offer a true blast from the past, evoking that heartwarming sense of nostalgia. Players can seamlessly engage in live Pong matches, pitting their skills against each other directly on our website. To keep things engaging, we've put in place a matchmaking system that lets you hop into a queue, where you'll be automatically paired with another eager player, just like in the good old days. Our Pong game can take on various forms, from the classic canvas game to a 3D-rendered version. Regardless of the style, we've remained faithful to the original Pong from 1972, preserving that timeless magic. For those who like a touch of customization, we've spiced things up with options like power-ups and different maps. But, if you're all about that authentic 90s Pong experience, you can easily opt for the default version without any extra features. As you dive into the game, you'll be met with a responsive design that ensures you can enjoy it seamlessly across various devices. So, come, relive the nostalgia, and let the essence of the 90s ping-pong games take you on a wonderful trip down memory lane!"
					/>
					<div className="flex justify-center py-10 border-solid border-4 border-black shadow-[2px_4px_0px_0px_#000301] min-[0px]:p-7">
						<img
							src={startGame}
							className="StartGame transition duration-500 ease border-solid border-black border-4"
						></img>
					</div>
				</div>
			</div>
		</div>
	);
}
