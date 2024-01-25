import { json } from "react-router-dom";
import { toast } from "react-toastify";

type error = {
	message: string[] | string;
	error: string,
	statusCode: number
}


const  HandleError = (res : Response) => {
	try {
		res.json().then((json : error | any ) => {
		if (typeof(json.message) === "string")
			toast.error(json.message)
		
		if (Array.isArray(json.message))
			toast.error(json.message[0]);
		
	}).catch((err) => {
	})
}
catch{
}
}
export default HandleError;