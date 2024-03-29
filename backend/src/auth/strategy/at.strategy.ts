import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload } from "../types";
import { Request, Request as RequestType } from "express";
import * as cookieParser from "cookie-parser";

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor(config: ConfigService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				AtStrategy.extractJWT,
				// ExtractJwt.fromAuthHeaderAsBearerToken(),
			]),
			secretOrKey: config.get<string>("AT_SECRET"),
		});
	}

	private static extractJWT(req: RequestType | any): string | null {
		if (req.cookies && "atToken" in req.cookies && req.cookies.atToken?.length > 0) {
			return req.cookies.atToken;
		}
		if (
			req.request &&
			req.request.headers.cookie &&
			req.request.headers.cookie.search("atToken") != -1 &&
			req.request.headers.cookie.length > 0
		) {
			// const on = JSON.parse(req.request.headers.cookie);
			const cook: string = req.request.headers.cookie;
			const atToken = cook.match(/(?<=atToken=)(.*?)(?=;|$)/)[0];
			if (!atToken || atToken.length < 2) return null;

			return atToken;
		}

		// throw new UnauthorizedException();
		return null;
	}

	validate(payload: JwtPayload) {
		return payload;
	}
}
